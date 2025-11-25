"""
Academic utility functions for USN parsing and semester calculations
"""
import re
from datetime import datetime, date
from typing import Dict, Optional, Tuple, List


def parse_usn(usn: str) -> Optional[Dict[str, any]]:
    """
    Parse USN to extract academic information
    Format: 4KV23CS062
    - 4KV: Institution code
    - 23: Joined year (2023)
    - CS: Department code
    - 062: Roll number
    """
    if not usn or len(usn) != 10:
        return None
    
    # USN Pattern: 4KV23CS062
    pattern = r'^([0-9])([A-Z]{2})([0-9]{2})([A-Z]{2})([0-9]{3})$'
    match = re.match(pattern, usn.upper())
    
    if not match:
        return None
    
    inst_digit, inst_letters, year_str, dept_code, roll_str = match.groups()
    institution_code = inst_digit + inst_letters
    joined_year = 2000 + int(year_str)  # 23 -> 2023
    roll_number = int(roll_str)
    
    return {
        'institution_code': institution_code,
        'joined_year': joined_year,
        'department_code': dept_code,
        'roll_number': roll_number,
        'year_str': year_str
    }


def calculate_current_semester(usn: str) -> Optional[int]:
    """
    Calculate current semester based on USN and current date
    
    Logic:
    - Extract joined year from USN
    - Calculate years passed since joining
    - Each year has 2 semesters (odd in July-Dec, even in Jan-June)
    """
    parsed = parse_usn(usn)
    if not parsed:
        return None
    
    joined_year = parsed['joined_year']
    current_date = datetime.now()
    current_year = current_date.year
    current_month = current_date.month
    
    # Calculate years since joining
    years_passed = current_year - joined_year
    
    # Determine current semester
    # Academic year starts in July (month 7)
    if current_month >= 7:  # July to December - odd semester
        semester = (years_passed * 2) + 1
    else:  # January to June - even semester
        semester = years_passed * 2
    
    # Ensure semester is within valid range (1-8)
    if semester < 1:
        semester = 1
    elif semester > 8:
        semester = 8
    
    return semester


def get_academic_year(usn: str = None, custom_date: date = None) -> str:
    """
    Get current academic year in format "2024-25"
    Academic year runs from July to June
    """
    if custom_date:
        current_date = custom_date
    else:
        current_date = date.today()
    
    if current_date.month >= 7:  # July onwards - new academic year starts
        start_year = current_date.year
    else:  # January to June - previous academic year continues
        start_year = current_date.year - 1
    
    end_year = start_year + 1
    return f"{start_year}-{end_year % 100:02d}"


def get_batch_year(usn: str) -> Optional[str]:
    """
    Get batch year range for a student
    Format: "2023-27" (4-year course)
    """
    parsed = parse_usn(usn)
    if not parsed:
        return None
    
    joined_year = parsed['joined_year']
    graduation_year = joined_year + 4  # Assuming 4-year course
    
    return f"{joined_year}-{graduation_year % 100:02d}"


def is_odd_semester(semester: int) -> bool:
    """Check if given semester is odd (1, 3, 5, 7)"""
    return semester % 2 == 1


def is_even_semester(semester: int) -> bool:
    """Check if given semester is even (2, 4, 6, 8)"""
    return semester % 2 == 0


def get_semester_type(semester: int) -> str:
    """Get semester type as string"""
    return "odd" if is_odd_semester(semester) else "even"


def validate_department_code(dept_code: str) -> bool:
    """Validate department code"""
    valid_departments = ["CS", "ME", "EC", "CV", "AI", "EE", "CH", "BT", "IT"]
    return dept_code.upper() in valid_departments


def get_department_name(dept_code: str) -> str:
    """Get full department name from code"""
    department_names = {
        "CS": "Computer Science and Engineering",
        "ME": "Mechanical Engineering",
        "EC": "Electronics and Communication Engineering",
        "CV": "Civil Engineering",
        "AI": "Artificial Intelligence and Machine Learning",
        "EE": "Electrical and Electronics Engineering",
        "CH": "Chemical Engineering",
        "BT": "Biotechnology",
        "IT": "Information Technology"
    }
    return department_names.get(dept_code.upper(), "Unknown Department")


def calculate_attendance_percentage(present: int, total: int) -> float:
    """Calculate attendance percentage"""
    if total == 0:
        return 0.0
    return round((present / total) * 100, 2)


def calculate_marks_percentage(obtained: float, maximum: float) -> float:
    """Calculate marks percentage"""
    if maximum == 0:
        return 0.0
    return round((obtained / maximum) * 100, 2)


def get_attendance_status(percentage: float) -> str:
    """Get attendance status based on percentage"""
    if percentage >= 85:
        return "Excellent"
    elif percentage >= 75:
        return "Good"
    elif percentage >= 65:
        return "Average"
    elif percentage >= 50:
        return "Below Average"
    else:
        return "Poor"


def get_grade_from_percentage(percentage: float) -> str:
    """Get grade based on percentage"""
    if percentage >= 90:
        return "A+"
    elif percentage >= 80:
        return "A"
    elif percentage >= 70:
        return "B+"
    elif percentage >= 60:
        return "B"
    elif percentage >= 50:
        return "C+"
    elif percentage >= 40:
        return "C"
    else:
        return "F"


def get_current_semester_subjects(department_code: str, semester: int) -> List[str]:
    """Get typical subjects for a department and semester"""
    # This is a sample implementation - in real scenario, this would come from database
    subjects_map = {
        "CS": {
            1: ["BCS101", "BCS102", "BCS103", "BCS104", "BCS105"],
            2: ["BCS201", "BCS202", "BCS203", "BCS204", "BCS205"],
            3: ["BCS301", "BCS302", "BCS303", "BCS304", "BCS305"],
            4: ["BCS401", "BCS402", "BCS403", "BCS404", "BCS405"],
            5: ["BCS501", "BCS502", "BCS503", "BCS504", "BCS505"],
            6: ["BCS601", "BCS602", "BCS603", "BCS604", "BCS605"],
            7: ["BCS701", "BCS702", "BCS703", "BCS704", "BCS705"],
            8: ["BCS801", "BCS802", "BCS803", "BCS804", "BCS805"]
        },
        "ME": {
            1: ["BME101", "BME102", "BME103", "BME104", "BME105"],
            2: ["BME201", "BME202", "BME203", "BME204", "BME205"],
            3: ["BME301", "BME302", "BME303", "BME304", "BME305"],
            4: ["BME401", "BME402", "BME403", "BME404", "BME405"],
            5: ["BME501", "BME502", "BME503", "BME504", "BME505"],
            6: ["BME601", "BME602", "BME603", "BME604", "BME605"],
            7: ["BME701", "BME702", "BME703", "BME704", "BME705"],
            8: ["BME801", "BME802", "BME803", "BME804", "BME805"]
        }
    }
    
    return subjects_map.get(department_code, {}).get(semester, [])


# Example usage and testing
if __name__ == "__main__":
    # Test USN parsing
    test_usns = ["4KV23CS062", "4KV22ME001", "4KV21EC045"]
    
    print("USN Parsing Tests:")
    print("=" * 40)
    
    for usn in test_usns:
        parsed = parse_usn(usn)
        if parsed:
            semester = calculate_current_semester(usn)
            academic_year = get_academic_year()
            batch = get_batch_year(usn)
            
            print(f"\nUSN: {usn}")
            print(f"  Institution: {parsed['institution_code']}")
            print(f"  Joined Year: {parsed['joined_year']}")
            print(f"  Department: {get_department_name(parsed['department_code'])}")
            print(f"  Roll Number: {parsed['roll_number']}")
            print(f"  Current Semester: {semester} ({get_semester_type(semester)})")
            print(f"  Academic Year: {academic_year}")
            print(f"  Batch: {batch}")
        else:
            print(f"Invalid USN: {usn}")
    
    print(f"\nCurrent Academic Year: {get_academic_year()}")
    print(f"Sample Attendance Status: {get_attendance_status(78.5)}")
    print(f"Sample Grade: {get_grade_from_percentage(85.2)}")