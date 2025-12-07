import os
import io
import csv
import json
import zipfile
import hashlib
from functools import wraps
from datetime import datetime
from flask import request, jsonify, send_file, session, send_from_directory
from main import app, db
from models import GenerationSession, Submission
from generator import generate_submissions
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import inch


ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "devops@graideon.com")
ADMIN_PASSWORD_HASH = os.environ.get("ADMIN_PASSWORD_HASH")


def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('authenticated'):
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    expected_email = ADMIN_EMAIL.lower()
    
    if ADMIN_PASSWORD_HASH:
        password_hash = hash_password(password)
        if email == expected_email and password_hash == ADMIN_PASSWORD_HASH:
            session['authenticated'] = True
            session['user_email'] = email
            session.permanent = True
            return jsonify({'success': True, 'email': email})
    
    return jsonify({'error': 'Invalid email or password'}), 401


@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True})


@app.route('/api/auth/check', methods=['GET'])
def check_auth():
    if session.get('authenticated'):
        return jsonify({'authenticated': True, 'email': session.get('user_email')})
    return jsonify({'authenticated': False})


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})


@app.route('/api/generate_submissions', methods=['POST'])
@login_required
def api_generate_submissions():
    try:
        data = request.get_json()
        
        assignment_title = data.get('assignment_title', '').strip()
        assignment_description = data.get('assignment_description', '').strip()
        rubric = data.get('rubric', '').strip() or None
        num_students = int(data.get('num_students', 5))
        grade_distribution = data.get('grade_distribution', 'normal')
        writing_level = data.get('writing_level', 'early_undergrad')
        variation_level = data.get('variation_level', 'medium')
        
        if not assignment_title:
            return jsonify({'error': 'Assignment title is required'}), 400
        if not assignment_description:
            return jsonify({'error': 'Assignment description is required'}), 400
        if len(assignment_description) < 20:
            return jsonify({'error': 'Assignment description must be at least 20 characters'}), 400
        if num_students < 1 or num_students > 50:
            return jsonify({'error': 'Number of students must be between 1 and 50'}), 400
        
        submissions = generate_submissions(
            assignment_title=assignment_title,
            assignment_description=assignment_description,
            rubric=rubric,
            num_students=num_students,
            grade_distribution=grade_distribution,
            writing_level=writing_level,
            variation_level=variation_level
        )
        
        session = GenerationSession(
            assignment_title=assignment_title,
            assignment_description=assignment_description,
            rubric=rubric,
            num_students=num_students,
            grade_distribution=grade_distribution,
            writing_level=writing_level,
            variation_level=variation_level
        )
        db.session.add(session)
        db.session.flush()
        
        for sub_data in submissions:
            submission = Submission(
                session_id=session.id,
                student_id=sub_data['id'],
                student_name=sub_data['student_name'],
                grade=sub_data['grade'],
                total_score=sub_data['total_score'],
                submission_text=sub_data['submission_text'],
                feedback=sub_data['feedback'],
                rubric_scores=sub_data['rubric_scores'],
                word_count=sub_data['word_count']
            )
            db.session.add(submission)
        
        db.session.commit()
        
        return jsonify({
            'session_id': session.id,
            'submissions': submissions,
            'total': len(submissions)
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/sessions', methods=['GET'])
@login_required
def get_sessions():
    sessions = GenerationSession.query.order_by(GenerationSession.created_at.desc()).limit(20).all()
    return jsonify([{
        'id': s.id,
        'assignment_title': s.assignment_title,
        'num_students': s.num_students,
        'created_at': s.created_at.isoformat()
    } for s in sessions])


@app.route('/api/sessions/<int:session_id>', methods=['GET'])
@login_required
def get_session(session_id):
    session = GenerationSession.query.get_or_404(session_id)
    return jsonify({
        'id': session.id,
        'assignment_title': session.assignment_title,
        'assignment_description': session.assignment_description,
        'rubric': session.rubric,
        'num_students': session.num_students,
        'grade_distribution': session.grade_distribution,
        'writing_level': session.writing_level,
        'submissions': [s.to_dict() for s in session.submissions]
    })


@app.route('/api/export/csv', methods=['POST'])
@login_required
def export_csv():
    try:
        data = request.get_json()
        submissions = data.get('submissions', [])
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        headers = ['Student ID', 'Student Name', 'Grade', 'Score', 'Word Count', 'Feedback', 'Submission Text']
        writer.writerow(headers)
        
        for sub in submissions:
            writer.writerow([
                sub['id'],
                sub['student_name'],
                sub['grade'],
                sub['total_score'],
                sub['word_count'],
                sub['feedback'],
                sub['submission_text']
            ])
        
        output.seek(0)
        return send_file(
            io.BytesIO(output.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name='submissions.csv'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/export/json', methods=['POST'])
@login_required
def export_json():
    try:
        data = request.get_json()
        submissions = data.get('submissions', [])
        
        return send_file(
            io.BytesIO(json.dumps(submissions, indent=2).encode('utf-8')),
            mimetype='application/json',
            as_attachment=True,
            download_name='submissions.json'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/export/pdf', methods=['POST'])
@login_required
def export_pdf():
    try:
        data = request.get_json()
        submission = data.get('submission')
        assignment_title = data.get('assignment_title', 'Assignment')
        
        if not submission:
            return jsonify({'error': 'Submission data is required'}), 400
        
        pdf_buffer = io.BytesIO()
        doc = SimpleDocTemplate(pdf_buffer, pagesize=letter,
                               rightMargin=72, leftMargin=72,
                               topMargin=72, bottomMargin=72)
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=12
        )
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=12,
            spaceAfter=6,
            spaceBefore=12
        )
        body_style = ParagraphStyle(
            'CustomBody',
            parent=styles['Normal'],
            fontSize=11,
            spaceAfter=6,
            leading=14
        )
        
        story = []
        
        story.append(Paragraph(f"Student Submission: {submission['student_name']}", title_style))
        story.append(Spacer(1, 0.2*inch))
        
        story.append(Paragraph(f"<b>Student ID:</b> {submission['id']}", body_style))
        story.append(Paragraph(f"<b>Assignment:</b> {assignment_title}", body_style))
        story.append(Paragraph(f"<b>Grade:</b> {submission['grade']} ({submission['total_score']}/100)", body_style))
        story.append(Paragraph(f"<b>Word Count:</b> {submission['word_count']}", body_style))
        story.append(Spacer(1, 0.2*inch))
        
        story.append(Paragraph("Submission", heading_style))
        submission_text = submission['submission_text'].replace('\n', '<br/>')
        story.append(Paragraph(submission_text, body_style))
        story.append(Spacer(1, 0.2*inch))
        
        story.append(Paragraph("Feedback", heading_style))
        story.append(Paragraph(submission['feedback'], body_style))
        
        if submission.get('rubric_scores'):
            story.append(Spacer(1, 0.2*inch))
            story.append(Paragraph("Rubric Breakdown", heading_style))
            for criterion in submission['rubric_scores']:
                story.append(Paragraph(
                    f"<b>{criterion['criterion']}:</b> {criterion['score']}/100",
                    body_style
                ))
                story.append(Paragraph(f"<i>{criterion['comment']}</i>", body_style))
        
        doc.build(story)
        pdf_buffer.seek(0)
        
        safe_name = submission['student_name'].replace(' ', '_')
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=False,
            download_name=f"{submission['id']}_{safe_name}.pdf"
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/export/zip', methods=['POST'])
@login_required
def export_zip():
    try:
        data = request.get_json()
        submissions = data.get('submissions', [])
        assignment_title = data.get('assignment_title', 'Assignment')
        
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for sub in submissions:
                pdf_buffer = io.BytesIO()
                doc = SimpleDocTemplate(pdf_buffer, pagesize=letter,
                                       rightMargin=72, leftMargin=72,
                                       topMargin=72, bottomMargin=72)
                
                styles = getSampleStyleSheet()
                title_style = ParagraphStyle(
                    'CustomTitle',
                    parent=styles['Heading1'],
                    fontSize=16,
                    spaceAfter=12
                )
                heading_style = ParagraphStyle(
                    'CustomHeading',
                    parent=styles['Heading2'],
                    fontSize=12,
                    spaceAfter=6,
                    spaceBefore=12
                )
                body_style = ParagraphStyle(
                    'CustomBody',
                    parent=styles['Normal'],
                    fontSize=11,
                    spaceAfter=6,
                    leading=14
                )
                
                story = []
                
                story.append(Paragraph(f"Student Submission: {sub['student_name']}", title_style))
                story.append(Spacer(1, 0.2*inch))
                
                story.append(Paragraph(f"<b>Student ID:</b> {sub['id']}", body_style))
                story.append(Paragraph(f"<b>Assignment:</b> {assignment_title}", body_style))
                story.append(Paragraph(f"<b>Grade:</b> {sub['grade']} ({sub['total_score']}/100)", body_style))
                story.append(Paragraph(f"<b>Word Count:</b> {sub['word_count']}", body_style))
                story.append(Spacer(1, 0.2*inch))
                
                story.append(Paragraph("Submission", heading_style))
                submission_text = sub['submission_text'].replace('\n', '<br/>')
                story.append(Paragraph(submission_text, body_style))
                story.append(Spacer(1, 0.2*inch))
                
                story.append(Paragraph("Feedback", heading_style))
                story.append(Paragraph(sub['feedback'], body_style))
                
                if sub.get('rubric_scores'):
                    story.append(Spacer(1, 0.2*inch))
                    story.append(Paragraph("Rubric Breakdown", heading_style))
                    for criterion in sub['rubric_scores']:
                        story.append(Paragraph(
                            f"<b>{criterion['criterion']}:</b> {criterion['score']}/100",
                            body_style
                        ))
                        story.append(Paragraph(f"<i>{criterion['comment']}</i>", body_style))
                
                doc.build(story)
                pdf_buffer.seek(0)
                
                safe_name = sub['student_name'].replace(' ', '_')
                zip_file.writestr(f"{sub['id']}_{safe_name}.pdf", pdf_buffer.getvalue())
            
            csv_buffer = io.StringIO()
            writer = csv.writer(csv_buffer)
            writer.writerow(['Student ID', 'Student Name', 'Grade', 'Score', 'Word Count', 'Feedback'])
            for sub in submissions:
                writer.writerow([
                    sub['id'], sub['student_name'], sub['grade'],
                    sub['total_score'], sub['word_count'], sub['feedback']
                ])
            zip_file.writestr('summary.csv', csv_buffer.getvalue())
            
            zip_file.writestr('submissions.json', json.dumps(submissions, indent=2))
        
        zip_buffer.seek(0)
        return send_file(
            zip_buffer,
            mimetype='application/zip',
            as_attachment=True,
            download_name='student_submissions.zip'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    """Serve the React frontend in production"""
    if app.static_folder and os.path.exists(app.static_folder):
        if path and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, 'index.html')
    return jsonify({'error': 'Frontend not built'}), 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
