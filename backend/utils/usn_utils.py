"""
USN (University Seat Number) utilities for student management
"""
import re
from datetime import datetime
from typing import Dict, List, Optional


def parse_usn(usn: str) -> Dict[str, any]:
    """
    Parse USN to extract components
    Format: 4KV22CS001
    - 4KV: Institution code
    - 22: Year joined (2022)
    - CS: Department code
    - 001: Roll number
    """
    if not usn or len(usn) != 10:
        raise ValueError("Invalid USN format. Expected format: 4KV22CS001")
    
    pattern = r'^([0-9][A-Z]{2})([0-9]{2})([A-Z]{2})([0-9]{3})$'
    match = re.match(pattern, usn.upper())
    
    if not match:
        raise ValueError("Invalid USN format. Expected format: 4KV22CS001")
    
    institution_code, year_str, department_code, roll_str = match.groups()
    
    return {
        'institution_code': institution_code,
        'year_joined': int(year_str),
        'department_code': department_code,
        'roll_number': int(roll_str),
        'full_year': 2000 + int(year_str)
    }


def calculate_current_semester(year_joined: int) -> int:
    """
    Calculate current semester based on year joined
    """
    current_year = datetime.now().year
    current_month = datetime.now().month
    
    # Calculate years passed
    years_passed = current_year - (2000 + year_joined)
    
    # Determine semester based on month (July-December = odd sem, Jan-June = even sem)
    if current_month >= 7:
        semester = (years_passed * 2) + 1
    else:
        semester = years_passed * 2
    
    # Clamp between 1 and 8
    return min(max(semester, 1), 8)


def generate_student_list(department_code: str, year_joined: int, start_roll: int = 1, end_roll: int = 60) -> List[str]:
    """
    Generate list of student USNs for a class
    """
    student_usns = []
    
    for roll in range(start_roll, end_roll + 1):
        usn = f"4KV{year_joined:02d}{department_code}{roll:03d}"
        student_usns.append(usn)
    
    return student_usns


def get_class_strength(department_code: str, year_joined: int) -> int:
    """
    Get typical class strength for a department
    """
    # Default class strengths by department
    strengths = {
        'CS': 60,
        'ME': 60,
        'EC': 60,
        'CV': 60,
        'EE': 60,
        'IT': 60
    }
    
    return strengths.get(department_code, 60)


def get_academic_year(year_joined: int, semester: int) -> str:
    """
    Get academic year string based on year joined and semester
    """
    full_year = 2000 + year_joined
    years_passed = (semester - 1) // 2
    
    start_year = full_year + years_passed
    end_year = start_year + 1
    
    return f"{start_year}-{end_year}"


def calculate_grade(percentage: float) -> str:
    """
    Calculate grade based on percentage
    """
    if percentage >= 90:
        return "A+"
    elif percentage >= 80:
        return "A"
    elif percentage >= 70:
        return "B+"
    elif percentage >= 60:
        return "B"
    elif percentage >= 50:
        return "C"
    elif percentage >= 40:
        return "D"
    else:
        return "F"


def get_department_name(department_code: str) -> str:
    """
    Get full department name from code
    """
    departments = {
        'CS': 'Computer Science and Engineering',
        'ME': 'Mechanical Engineering',
        'EC': 'Electronics and Communication Engineering',
        'CV': 'Civil Engineering',
        'EE': 'Electrical and Electronics Engineering',
        'IT': 'Information Technology'
    }
    
    return departments.get(department_code, f"Department {department_code}")


def get_semester_subjects(department_code: str, semester: int) -> List[Dict[str, str]]:
    """
    Get typical subjects for a department and semester
    """
    # This is a simplified version - in production, this would come from database
    subjects = {
        'CS': {
            1: [
                {'code': 'BCS101', 'name': 'Programming in C'},
                {'code': 'BCS102', 'name': 'Mathematics I'},
                {'code': 'BCS103', 'name': 'Physics'},
                {'code': 'BCS104', 'name': 'Chemistry'},
                {'code': 'BCS105', 'name': 'English'}
            ],
            2: [
                {'code': 'BCS201', 'name': 'Data Structures'},
                {'code': 'BCS202', 'name': 'Mathematics II'},
                {'code': 'BCS203', 'name': 'Digital Electronics'},
                {'code': 'BCS204', 'name': 'Computer Organization'},
                {'code': 'BCS205', 'name': 'Environmental Science'}
            ]
        }
    }
    
    return subjects.get(department_code, {}).get(semester, [])


def generate_class_identifier(department_code: str, semester: int, section: str = "A") -> str:
    """
    Generate a class identifier string
    """
    return f"{department_code}{semester}{section}"


def validate_usn_format(usn: str) -> bool:
    """
    Validate USN format without raising exceptions
    """
    try:
        parse_usn(usn)
        return True
    except ValueError:
        return False


def extract_batch_year(usn: str) -> Optional[int]:
    """
    Extract batch year from USN
    """
    try:
        components = parse_usn(usn)
        return components['full_year']
    except ValueError:
        return None


def is_same_batch(usn1: str, usn2: str) -> bool:
    """
    Check if two USNs belong to the same batch
    """
    try:
        year1 = extract_batch_year(usn1)
        year2 = extract_batch_year(usn2)
        return year1 is not None and year1 == year2
    except:
        return False


def get_usn_department(usn: str) -> Optional[str]:
    """
    Extract department code from USN
    """
    try:
        components = parse_usn(usn)
        return components['department_code']
    except ValueError:
        return None


def get_academic_year() -> str:
    """
    Get current academic year string
    """
    current_year = datetime.now().year
    current_month = datetime.now().month
    
    if current_month >= 7:  # July onwards is new academic year
        return f"{current_year}-{current_year + 1}"
    else:
        return f"{current_year - 1}-{current_year}"


def is_odd_semester(semester: int) -> bool:
    """
    Check if semester is odd (1, 3, 5, 7)
    """
    return semester % 2 == 1


def is_even_semester(semester: int) -> bool:
    """
    Check if semester is even (2, 4, 6, 8)
    """
    return semester % 2 == 0