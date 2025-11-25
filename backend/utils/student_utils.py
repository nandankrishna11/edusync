"""
Student Utilities for USN parsing and class generation
"""
import re
from typing import List, Dict, Tuple, Optional
from datetime import datetime, date


def parse_usn(usn: str) -> Dict[str, any]:
    """
    Parse USN to extract components
    Format: 4KV22CS001
    - 4KV: Institution code
    - 22: Year joined (2022)
    - CS: Department code
    - 001: Roll number
    """
    usn = usn.upper().strip()
    
    # Validate USN format
    if not re.match(r'^[0-9][A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{3}$', usn):
        raise ValueError(f"Invalid USN format: {usn}. Expected format: 4KV22CS001")
    
    return {
        'institution_code': usn[:3],  # 4KV
        'year_joined': int(usn[3:5]),  # 22 -> 2022
        'department_code': usn[5:7],  # CS
        'roll_number': int(usn[7:10]),  # 001
        'full_year': 2000 + int(usn[3:5])  # 2022
    }


def calculate_current_semester(year_joined: int, current_date: Optional[date] = None) -> int:
    """
    Calculate current semester based on year joined
    Assumes 2 semesters per year, starting from July
    """
    if current_date is None:
        current_date = date.today()
    
    current_year = current_date.year
    current_month = current_date.month
    
    # Academic year starts in July
    if current_month >= 7:
        academic_year = current_year
    else:
        academic_year = current_year - 1
    
    years_completed = academic_year - (2000 + year_joined)
    
    # Calculate semester (2 per year, max 8)
    if current_month >= 7:
        # Second half of academic year (odd semesters: 1, 3, 5, 7)
        semester = (years_completed * 2) + 1
    else:
        # First half of academic year (even semesters: 2, 4, 6, 8)
        semester = years_completed * 2
    
    # Ensure semester is between 1 and 8
    return max(1, min(8, semester))


def generate_student_list(department_code: str, year_joined: int, start_roll: int = 1, end_roll: int = 60, 
                         institution_code: str = "4KV") -> List[str]:
    """
    Generate list of USNs for a department and year
    Default: 60 students per department per year
    """
    usns = []
    year_suffix = str(year_joined)[-2:]  # 22 from 2022
    
    for roll in range(start_roll, end_roll + 1):
        usn = f"{institution_code}{year_suffix}{department_code}{roll:03d}"
        usns.append(usn)
    
    return usns


def get_class_strength(department_code: str, year_joined: int) -> int:
    """
    Get typical class strength for a department
    This can be customized based on actual data
    """
    # Default strengths by department
    default_strengths = {
        'CS': 60,
        'ME': 60,
        'EC': 60,
        'CV': 60,
        'EE': 60,
        'IT': 60,
        'IS': 60
    }
    
    return default_strengths.get(department_code, 60)


def get_academic_year(year_joined: int, semester: int) -> str:
    """
    Get academic year string based on year joined and current semester
    """
    years_passed = (semester - 1) // 2
    start_year = (2000 + year_joined) + years_passed
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
        'IT': 'Information Technology',
        'IS': 'Information Science and Engineering',
        'AE': 'Aeronautical Engineering',
        'BT': 'Biotechnology',
        'CH': 'Chemical Engineering'
    }
    
    return departments.get(department_code, f"{department_code} Engineering")


def validate_semester_subject(department_code: str, semester: int, subject_code: str) -> bool:
    """
    Validate if a subject belongs to a specific department and semester
    This would typically check against a subject master table
    """
    # Basic validation - subject code should start with department prefix
    if not subject_code.startswith(f"B{department_code}"):
        return False
    
    # Extract semester from subject code (e.g., BCS501 -> semester 5)
    try:
        subject_semester = int(subject_code[3])
        return subject_semester == semester
    except (ValueError, IndexError):
        return False


def get_semester_subjects(department_code: str, semester: int) -> List[Dict[str, str]]:
    """
    Get typical subjects for a department and semester
    This is demo data - in production, this would come from database
    """
    subjects = {
        'CS': {
            1: [
                {'code': 'BCS101', 'name': 'Programming in C'},
                {'code': 'BCS102', 'name': 'Engineering Mathematics I'},
                {'code': 'BCS103', 'name': 'Engineering Physics'},
                {'code': 'BCS104', 'name': 'Engineering Chemistry'},
                {'code': 'BCS105', 'name': 'Basic Electronics'}
            ],
            3: [
                {'code': 'BCS301', 'name': 'Data Structures'},
                {'code': 'BCS302', 'name': 'Digital Logic Design'},
                {'code': 'BCS303', 'name': 'Computer Organization'},
                {'code': 'BCS304', 'name': 'Discrete Mathematics'},
                {'code': 'BCS305', 'name': 'Object Oriented Programming'}
            ],
            5: [
                {'code': 'BCS501', 'name': 'Design and Analysis of Algorithms'},
                {'code': 'BCS502', 'name': 'Database Management Systems'},
                {'code': 'BCS503', 'name': 'Computer Networks'},
                {'code': 'BCS504', 'name': 'Operating Systems'},
                {'code': 'BCS505', 'name': 'Software Engineering'}
            ],
            7: [
                {'code': 'BCS701', 'name': 'Machine Learning'},
                {'code': 'BCS702', 'name': 'Compiler Design'},
                {'code': 'BCS703', 'name': 'Web Technologies'},
                {'code': 'BCS704', 'name': 'Information Security'},
                {'code': 'BCS705', 'name': 'Project Work'}
            ]
        },
        'ME': {
            1: [
                {'code': 'BME101', 'name': 'Engineering Mathematics I'},
                {'code': 'BME102', 'name': 'Engineering Physics'},
                {'code': 'BME103', 'name': 'Engineering Chemistry'},
                {'code': 'BME104', 'name': 'Engineering Graphics'},
                {'code': 'BME105', 'name': 'Basic Mechanical Engineering'}
            ],
            3: [
                {'code': 'BME301', 'name': 'Strength of Materials'},
                {'code': 'BME302', 'name': 'Thermodynamics'},
                {'code': 'BME303', 'name': 'Fluid Mechanics'},
                {'code': 'BME304', 'name': 'Manufacturing Processes'},
                {'code': 'BME305', 'name': 'Material Science'}
            ],
            5: [
                {'code': 'BME501', 'name': 'Machine Design'},
                {'code': 'BME502', 'name': 'Heat Transfer'},
                {'code': 'BME503', 'name': 'Production Technology'},
                {'code': 'BME504', 'name': 'Dynamics of Machines'},
                {'code': 'BME505', 'name': 'Automobile Engineering'}
            ]
        }
    }
    
    return subjects.get(department_code, {}).get(semester, [])


def generate_class_identifier(department_code: str, semester: int, section: str = "A") -> str:
    """
    Generate a class identifier for backward compatibility
    Format: CS5A (Department + Semester + Section)
    """
    return f"{department_code}{semester}{section}"


def extract_usn_components_batch(usns: List[str]) -> Dict[str, List[str]]:
    """
    Extract components from multiple USNs and group them
    """
    result = {
        'departments': set(),
        'years': set(),
        'institutions': set(),
        'by_department': {},
        'by_year': {},
        'by_semester': {}
    }
    
    for usn in usns:
        try:
            components = parse_usn(usn)
            dept = components['department_code']
            year = components['year_joined']
            inst = components['institution_code']
            
            result['departments'].add(dept)
            result['years'].add(year)
            result['institutions'].add(inst)
            
            # Group by department
            if dept not in result['by_department']:
                result['by_department'][dept] = []
            result['by_department'][dept].append(usn)
            
            # Group by year
            if year not in result['by_year']:
                result['by_year'][year] = []
            result['by_year'][year].append(usn)
            
            # Group by current semester
            current_sem = calculate_current_semester(year)
            if current_sem not in result['by_semester']:
                result['by_semester'][current_sem] = []
            result['by_semester'][current_sem].append(usn)
            
        except ValueError:
            continue  # Skip invalid USNs
    
    # Convert sets to lists for JSON serialization
    result['departments'] = list(result['departments'])
    result['years'] = list(result['years'])
    result['institutions'] = list(result['institutions'])
    
    return result