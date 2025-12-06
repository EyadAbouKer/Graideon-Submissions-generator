from datetime import datetime
from main import db
from sqlalchemy import JSON


class GenerationSession(db.Model):
    __tablename__ = 'generation_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    assignment_title = db.Column(db.String(500), nullable=False)
    assignment_description = db.Column(db.Text, nullable=False)
    rubric = db.Column(db.Text, nullable=True)
    num_students = db.Column(db.Integer, nullable=False)
    grade_distribution = db.Column(db.String(100), nullable=False)
    writing_level = db.Column(db.String(100), nullable=False)
    variation_level = db.Column(db.String(50), nullable=False, default='medium')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    submissions = db.relationship('Submission', backref='session', lazy=True, cascade='all, delete-orphan')


class Submission(db.Model):
    __tablename__ = 'submissions'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('generation_sessions.id'), nullable=False)
    student_id = db.Column(db.String(50), nullable=False)
    student_name = db.Column(db.String(200), nullable=False)
    grade = db.Column(db.String(10), nullable=False)
    total_score = db.Column(db.Float, nullable=False)
    submission_text = db.Column(db.Text, nullable=False)
    feedback = db.Column(db.Text, nullable=False)
    rubric_scores = db.Column(JSON, nullable=True)
    word_count = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.student_id,
            'student_name': self.student_name,
            'grade': self.grade,
            'total_score': self.total_score,
            'submission_text': self.submission_text,
            'feedback': self.feedback,
            'rubric_scores': self.rubric_scores,
            'word_count': self.word_count
        }
