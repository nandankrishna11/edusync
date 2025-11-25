"""
Academic services for USN parsing, subject codes, and semester management
"""
from datetime import datetime, date
from typing import Dict, Optional
import re


class USNService:
    """Service for handling USN operations"""
    
    USN_PATTERN = re.compile(r'^4KV(\d{2})([A-Z]{2})(\d{3})$')
    
    @staticmethod
    def parse_usn(usn: str) -> Dict[str, any]:
        """
        Parse USN into components
        Format: 4KV22CS001
        """
        if not usn or len(usn) != 10:
            raise ValueError("USN must be exactly 10 characters")
        
        match = USNService.USN_PATTERN.match(usn.upper())
        if not match:
            raise ValueError("Invalid USN format. Expected: 4KVyyDDnnn (e.g., 4KV22CS001)")
        
        joined_year, department_code, roll_str = match.groups()
        
        return {
            "institution_code": "4KV",
            "joined_year": int(joined_year),
            "department_code": department_code,
            "roll_number": int(roll_str),
            "full_year": 2000 + int(joined_year)  # 22 -> 2022
        }
    
    @staticmethod
    def generate_usn(year: int, dept: str, roll: int) -> str:
        """
        Generate USN from components
        Args:
            year: Joined year (e.g., 22 for 2022)
            dept: Department code (e.g., 'CS')
            roll: Roll number (e.g., 1 for 001)
        """
        if not (0 <= year <= 99):
            raise ValueError("Year must be between 0-99")
        if not dept or len(dept) != 2 or not dept.isalpha():
            raise ValueError("Department code must be 2 alphabetic characters")
        if not (1 <= roll <= 999):
            raise ValueError("Roll number must be between 1-999")
        
        return f"4KV{year:02d}{dept.upper()}{roll:03d}"
    
    @staticmethod
    def validate_usn(usn: str) -> bool:
        """Validate USN format"""
        try:
            USNService.parse_usn(usn)
            return True
        except ValueError:
            return False
    
    @staticmethod
    def get_current_semester(usn: str, current_date: Optional[date] = None) -> int:
        """
        Calculate current semester based on USN and current date
        Assumes:
        - Odd semesters (1,3,5,7) start in July
        - Even semesters (2,4,6,8) start in January
        """
        if current_date is None:
            current_date = date.today()
        
        components = USNService.parse_usn(usn)
        joined_year = components["full_year"]
        
        # Calculate years since joining
        years_passed = current_date.year - joined_year
        
        # Determine semester based on month
        if current_date.month >= 7:  # July onwards = odd semester
            semester = (years_passed * 2) + 1
        else:  # January-June = even semester
            semester = years_passed * 2
        
        # Clamp between 1-8 (4-year program)
        return min(max(semester, 1), 8)
    
    @staticmethod
    def get_batch_year(usn: str) -> str:
        """Get batch year from USN (e.g., 2022-26)"""
        components = USNService.parse_usn(usn)
        start_year = components["full_year"]
        end_year = start_year + 4
        return f"{start_year}-{end_year}"


class SubjectCodeService:
    """Service for handling subject code operations"""
    
    SUBJECT_PATTERN = re.compile(r'^([A-Z])([A-Z]{2})([1-8])(\d{2})$')
    
    @staticmethod
    def parse_subject_code(code: str) -> Dict[str, any]:
        """
        Parse subject code into components
        Format: BCS801 (Bachelor's CS 8th semester, subject 01)
        """
        if not code or len(code) != 6:
            raise ValueError("Subject code must be exactly 6 characters")
        
        match = SubjectCodeService.SUBJECT_PATTERN.match(code.upper())
        if not match:
            raise ValueError("Invalid subject code format. Expected: BDDsnn (e.g., BCS801)")
        
        degree_type, department_code, semester_str, sequence_str = match.groups()
        
        return {
            "degree_type": degree_type,
            "department_code": department_code,
            "semester": int(semester_str),
            "sequence": int(sequence_str)
        }
    
    @staticmethod
    def generate_subject_code(dept: str, semester: int, sequence: int) -> str:
        """
        Generate subject code from components
        Args:
            dept: Department code (e.g., 'CS')
            semester: Semester number (1-8)
            sequence: Subject sequence (1-99)
        """
        if not dept or len(dept) != 2 or not dept.isalpha():
            raise ValueError("Department code must be 2 alphabetic characters")
        if not (1 <= semester <= 8):
            raise ValueError("Semester must be between 1-8")
        if not (1 <= sequence <= 99):
            raise ValueError("Sequence must be between 1-99")
        
        return f"B{dept.upper()}{semester}{sequence:02d}"
    
    @staticmethod
    def validate_subject_code(code: str) -> bool:
        """Validate subject code format"""
        try:
            SubjectCodeService.parse_subject_code(code)
            return True
        except ValueError:
            return False
    
    @staticmethod
    def get_subjects_for_semester(department: str, semester: int) -> list:
        """Get all subject codes for a given department and semester"""
        subjects = []
        for seq in range(1, 10):  # Assuming max 9 subjects per semester
            try:
                code = SubjectCodeService.generate_subject_code(department, semester, seq)
                subjects.append(code)
            except ValueError:
                break
        return subjects


class AcademicCalendarService:
    """Service for academic calendar operations"""
    
    @staticmethod
    def get_current_academic_year(current_date: Optional[date] = None) -> str:
        """
        Get current academic year (e.g., 2023-24)
        Academic year starts in July
        """
        if current_date is None:
            current_date = date.today()
        
        if current_date.month >= 7:  # July onwards = new academic year
            start_year = current_date.year
            end_year = current_date.year + 1
        else:  # January-June = previous academic year
            start_year = current_date.year - 1
            end_year = current_date.year
        
        return f"{start_year}-{str(end_year)[2:]}"
    
    @staticmethod
    def get_semester_dates(academic_year: str, semester: int) -> Dict[str, date]:
        """
        Get start and end dates for a semester
        Args:
            academic_year: e.g., "2023-24"
            semester: 1-8 (odd semesters start July, even start January)
        """
        start_year = int(academic_year.split('-')[0])
        
        if semester % 2 == 1:  # Odd semester (July start)
            year = start_year if semester <= 4 else start_year + 2
            start_date = date(year, 7, 1)
            end_date = date(year, 12, 31)
        else:  # Even semester (January start)
            year = start_year + 1 if semester <= 4 else start_year + 3
            start_date = date(year, 1, 1)
            end_date = date(year, 6, 30)
        
        return {
            "start_date": start_date,
            "end_date": end_date
        }
    
    @staticmethod
    def is_semester_active(academic_year: str, semester: int, current_date: Optional[date] = None) -> bool:
        """Check if a semester is currently active"""
        if current_date is None:
            current_date = date.today()
        
        dates = AcademicCalendarService.get_semester_dates(academic_year, semester)
        return dates["start_date"] <= current_date <= dates["end_date"]
    
    @staticmethod
    def get_academic_year_from_usn(usn: str) -> str:
        """Get the academic year when a student joined based on USN"""
        components = USNService.parse_usn(usn)
        joined_year = components["full_year"]
        return f"{joined_year}-{str(joined_year + 1)[2:]}"


# Department mappings
DEPARTMENT_MAPPINGS = {
    "CS": "Computer Science",
    "ME": "Mechanical Engineering", 
    "EC": "Electronics and Communication",
    "IS": "Information Science",
    "EE": "Electrical Engineering",
    "CV": "Civil Engineering",
    "CH": "Chemical Engineering",
    "BT": "Biotechnology",
    "MT": "Mathematics",
    "PH": "Physics"
}

def get_department_name(code: str) -> str:
    """Get full department name from code"""
    return DEPARTMENT_MAPPINGS.get(code.upper(), f"Unknown Department ({code})")

def get_all_departments() -> Dict[str, str]:
    """Get all department codes and names"""
    return DEPARTMENT_MAPPINGS.copy()