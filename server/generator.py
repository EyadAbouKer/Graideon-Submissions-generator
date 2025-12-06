import os
import json
import random
import logging
from typing import Optional
from google import genai
from google.genai import types

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_gemini_client():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not set. Please configure your Gemini API key.")
    return genai.Client(api_key=api_key)

FIRST_NAMES = [
    "Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Sophia", "Mason",
    "Isabella", "William", "Mia", "James", "Charlotte", "Oliver", "Amelia",
    "Benjamin", "Harper", "Elijah", "Evelyn", "Lucas", "Abigail", "Henry",
    "Emily", "Alexander", "Elizabeth", "Michael", "Sofia", "Daniel", "Avery",
    "Matthew", "Ella", "Aiden", "Madison", "Joseph", "Scarlett", "Jackson",
    "Victoria", "Sebastian", "Aria", "David", "Grace", "Carter", "Chloe",
    "Wyatt", "Camila", "Jayden", "Penelope", "John", "Riley", "Owen"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
    "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
    "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
    "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark",
    "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King",
    "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green",
    "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell"
]

GRADE_SCORES = {
    'A': (90, 100),
    'B': (80, 89),
    'C': (70, 79),
    'D': (60, 69),
    'F': (0, 59)
}

GRADE_DISTRIBUTIONS = {
    'normal': {'A': 0.15, 'B': 0.30, 'C': 0.35, 'D': 0.15, 'F': 0.05},
    'mostly_average': {'A': 0.10, 'B': 0.25, 'C': 0.45, 'D': 0.15, 'F': 0.05},
    'high_performing': {'A': 0.35, 'B': 0.40, 'C': 0.20, 'D': 0.04, 'F': 0.01},
    'struggling': {'A': 0.05, 'B': 0.15, 'C': 0.30, 'D': 0.35, 'F': 0.15}
}

WRITING_LEVEL_DESCRIPTIONS = {
    'high_school': 'a high school student (9th-12th grade) with basic academic writing skills',
    'early_undergrad': 'an early undergraduate student (freshman/sophomore) with developing academic writing abilities',
    'advanced_undergrad': 'an advanced undergraduate student (junior/senior) with strong academic writing skills'
}


def generate_student_name():
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"


def assign_grades(num_students: int, distribution: str) -> list:
    dist = GRADE_DISTRIBUTIONS.get(distribution, GRADE_DISTRIBUTIONS['normal'])
    grades = []
    
    for grade, percentage in dist.items():
        count = round(num_students * percentage)
        grades.extend([grade] * count)
    
    while len(grades) < num_students:
        grades.append('C')
    while len(grades) > num_students:
        grades.pop()
    
    random.shuffle(grades)
    return grades


def get_score_for_grade(grade: str) -> int:
    min_score, max_score = GRADE_SCORES[grade]
    return random.randint(min_score, max_score)


def parse_rubric(rubric_text: str) -> list:
    if not rubric_text or not rubric_text.strip():
        return []
    
    criteria = []
    lines = rubric_text.strip().split('\n')
    
    for line in lines:
        line = line.strip()
        if line and len(line) > 2:
            line = line.lstrip('•-*0123456789.) ')
            if ':' in line:
                parts = line.split(':', 1)
                criteria.append(parts[0].strip())
            elif len(line) < 100:
                criteria.append(line)
    
    if not criteria:
        criteria = ['Content Quality', 'Organization', 'Writing Mechanics']
    
    return criteria[:10]


def generate_submission_with_gemini(
    assignment_title: str,
    assignment_description: str,
    rubric_text: Optional[str],
    grade: str,
    score: int,
    writing_level: str,
    variation_level: str,
    student_name: str,
    rubric_criteria: list
) -> dict:
    variation_instructions = {
        'low': 'Write in a consistent, standard style.',
        'medium': 'Include some personal voice and moderate stylistic variation.',
        'high': 'Use a distinctive personal style with significant variation in approach, structure, and voice.'
    }
    
    grade_quality_instructions = {
        'A': 'Write an excellent submission with thorough analysis, strong arguments, proper structure, and virtually no errors. Demonstrate deep understanding and critical thinking.',
        'B': 'Write a good submission with solid content and organization, minor weaknesses in depth or detail. Include 1-2 very minor errors.',
        'C': 'Write an adequate submission that meets basic requirements but lacks depth. Include some organizational issues and a few grammar/spelling errors. Show surface-level understanding.',
        'D': 'Write a below-average submission with incomplete ideas, poor organization, and several errors. Miss some key points and show limited understanding.',
        'F': 'Write a poor submission that fails to address the assignment properly. Include many errors, lack of coherence, and demonstrate misunderstanding of the topic.'
    }
    
    rubric_section = ""
    if rubric_criteria:
        rubric_section = f"\n\nThe rubric criteria are: {', '.join(rubric_criteria)}. Ensure your response quality aligns with the grade level across all criteria."
    
    prompt = f"""You are simulating a student named {student_name} who is {WRITING_LEVEL_DESCRIPTIONS[writing_level]}.

Assignment Title: {assignment_title}
Assignment Description: {assignment_description}
{rubric_section}

Target Grade: {grade} ({score}/100)

{grade_quality_instructions[grade]}

{variation_instructions[variation_level]}

Write the student's submission for this assignment. The submission should:
- Be realistic for the target grade level and writing level
- Be between 200-800 words depending on the grade (A grades tend to be more thorough)
- Include natural student voice and writing patterns
- Match the quality expectations for a {grade} grade

IMPORTANT: Write ONLY the student's submission text. Do not include any meta-commentary, labels, or explanations."""

    try:
        client = get_gemini_client()
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        submission_text = response.text if response.text else "Error generating submission."
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        submission_text = f"[Error generating submission: {str(e)}]"
    
    return submission_text


def generate_feedback_with_gemini(
    submission_text: str,
    grade: str,
    score: int,
    rubric_criteria: list
) -> tuple:
    rubric_request = ""
    if rubric_criteria:
        rubric_request = f"""
Also provide rubric scores as a JSON array called "rubric_scores" where each item has:
- "criterion": the criterion name
- "score": a score out of 100 consistent with the overall grade
- "comment": a brief comment (1-2 sentences) about performance on this criterion

Criteria to evaluate: {', '.join(rubric_criteria)}"""
    
    prompt = f"""You are a teacher grading a student submission.

Submission Text:
{submission_text[:3000]}

Overall Grade: {grade} ({score}/100)

Provide feedback in JSON format with these fields:
- "feedback": A constructive 2-3 sentence feedback comment appropriate for this grade level
{rubric_request}

Respond with valid JSON only."""

    try:
        client = get_gemini_client()
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        
        result = json.loads(response.text) if response.text else {}
        feedback = result.get('feedback', 'Good effort on this assignment.')
        rubric_scores = result.get('rubric_scores', None)
        
    except Exception as e:
        logger.error(f"Feedback generation error: {e}")
        feedback = f"Grade: {grade}. {get_fallback_feedback(grade)}"
        rubric_scores = None
    
    return feedback, rubric_scores


def get_fallback_feedback(grade: str) -> str:
    feedback_templates = {
        'A': 'Excellent work! Your submission demonstrates thorough understanding and strong analytical skills.',
        'B': 'Good job! Your work shows solid understanding with room for minor improvements in depth.',
        'C': 'Adequate work that meets basic requirements. Consider adding more detail and improving organization.',
        'D': 'Your submission needs improvement. Focus on addressing all aspects of the assignment.',
        'F': 'This submission does not meet the assignment requirements. Please review the instructions and seek help.'
    }
    return feedback_templates.get(grade, 'Please review your submission.')


def generate_submissions(
    assignment_title: str,
    assignment_description: str,
    rubric: Optional[str],
    num_students: int,
    grade_distribution: str,
    writing_level: str,
    variation_level: str = 'medium'
) -> list:
    num_students = max(1, min(50, num_students))
    
    grades = assign_grades(num_students, grade_distribution)
    rubric_criteria = parse_rubric(rubric) if rubric else []
    
    used_names = set()
    submissions = []
    
    for i in range(num_students):
        student_name = generate_student_name()
        while student_name in used_names:
            student_name = generate_student_name()
        used_names.add(student_name)
        
        grade = grades[i]
        score = get_score_for_grade(grade)
        student_id = f"STU{str(i+1).zfill(4)}"
        
        submission_text = generate_submission_with_gemini(
            assignment_title=assignment_title,
            assignment_description=assignment_description,
            rubric_text=rubric,
            grade=grade,
            score=score,
            writing_level=writing_level,
            variation_level=variation_level,
            student_name=student_name,
            rubric_criteria=rubric_criteria
        )
        
        feedback, rubric_scores = generate_feedback_with_gemini(
            submission_text=submission_text,
            grade=grade,
            score=score,
            rubric_criteria=rubric_criteria
        )
        
        word_count = len(submission_text.split())
        
        submissions.append({
            'id': student_id,
            'student_name': student_name,
            'grade': grade,
            'total_score': score,
            'submission_text': submission_text,
            'feedback': feedback,
            'rubric_scores': rubric_scores,
            'word_count': word_count
        })
        
        logger.info(f"Generated submission {i+1}/{num_students} for {student_name} (Grade: {grade})")
    
    return submissions
