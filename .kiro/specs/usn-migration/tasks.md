# Implementation Plan - USN-Based Authentication Migration

## Overview
This implementation plan converts the EduSync system from email-based to USN-based authentication through systematic database, backend, and frontend updates while maintaining all existing functionality.

## Implementation Tasks

### Phase 1: Database Schema and Model Updates

- [ ] 1. Update User model with USN field
  - Add USN column as unique, indexed, non-nullable field
  - Make email optional (nullable=True)
  - Update model relationships and constraints
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 1.1 Modify User model in backend/modules/auth/models.py
  - Add usn = Column(String, unique=True, index=True, nullable=False)
  - Change email to nullable=True
  - Update __repr__ method to include USN
  - _Requirements: 1.1, 1.2_

- [ ] 1.2 Update related models for USN references
  - Change AttendanceModel.student_id to usn field
  - Change NotificationModel.student_id to target_usn field  
  - Change Timetable.professor_id to professor_usn field
  - _Requirements: 1.4, 6.1, 6.2, 6.3_

- [ ] 1.3 Create database migration script
  - Generate migration for existing users with sample USNs
  - Preserve all existing user data during migration
  - Handle data integrity and constraint updates
  - _Requirements: 8.1, 8.2, 8.3_

### Phase 2: Authentication Service Updates

- [x] 2. Update authentication logic for USN-based login

  - Modify login verification to use USN instead of email
  - Update JWT token generation to include USN
  - Maintain existing password security standards
  - _Requirements: 2.1, 2.2, 2.3, 7.1_

- [x] 2.1 Update authentication services in backend/modules/auth/services.py


  - Modify authenticate_user() to query by USN
  - Update get_user() function to accept USN parameter
  - Change create_access_token() to include USN in payload
  - Update get_current_user() to extract USN from token
  - _Requirements: 2.1, 2.2, 7.1, 7.3_


- [ ] 2.2 Update user creation and management services
  - Modify create_user() to require USN and make email optional
  - Update user lookup functions to use USN
  - Maintain password hashing and verification logic

  - _Requirements: 3.1, 3.2, 3.3, 4.2_

- [ ] 2.3 Update authentication dependencies
  - Modify get_current_user dependency to work with USN
  - Update role-based access control to use USN
  - Ensure security levels are maintained
  - _Requirements: 7.2, 7.4_

### Phase 3: API Routes and Schema Updates

- [ ] 3. Update API routes for USN-based authentication
  - Modify login endpoint to accept USN credentials
  - Update registration endpoint for USN collection
  - Change password reset to use USN identification
  - _Requirements: 2.1, 3.1, 4.1_



- [x] 3.1 Update authentication routes in backend/modules/auth/routes.py

  - Modify /token endpoint to authenticate with USN
  - Update /register endpoint to require USN
  - Change error messages to reference USN
  - Update /me endpoint to return USN information
  - _Requirements: 2.1, 3.1, 2.5_


- [ ] 3.2 Update Pydantic schemas in backend/modules/auth/schemas.py
  - Add usn field to UserBase schema as required
  - Make email optional in schemas
  - Update TokenData to include USN instead of username
  - Modify validation rules for USN format
  - _Requirements: 3.1, 5.1, 7.1_

- [ ] 3.3 Update cross-module API routes
  - Modify attendance routes to use USN references
  - Update notification routes for USN-based targeting
  - Change analytics routes to group by USN
  - Update timetable routes for professor USN
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

### Phase 4: Frontend Authentication Updates

- [ ] 4. Update frontend authentication components
  - Modify login form to use USN field
  - Update registration form to collect USN
  - Change API service calls to send USN credentials


  - Update session storage to use USN identification
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 4.1 Update login form in frontend/src/features/auth/components/LoginForm.js
  - Change email field to USN field


  - Update form validation for USN format
  - Modify submit handler to send USN credentials
  - Update error messages to reference USN
  - _Requirements: 5.1, 5.2_

- [x] 4.2 Update registration form in frontend/src/features/auth/components/RegisterForm.js

  - Add USN field as required input


  - Make email field optional
  - Add USN format validation
  - Update form submission logic
  - _Requirements: 5.1, 5.2_

- [ ] 4.3 Update authentication service in frontend/src/features/auth/services/authService.js
  - Modify login function to send USN instead of email
  - Update registration function for USN data
  - Change token handling to work with USN
  - _Requirements: 5.3, 7.1_

- [ ] 4.4 Update authentication context and hooks
  - Modify useAuth hook to handle USN-based sessions
  - Update user context to store USN information
  - Change session storage keys to use USN
  - _Requirements: 5.4, 7.3_

### Phase 5: Cross-Module USN Integration

- [ ] 5. Update all modules to use USN references
  - Modify attendance components to display USN
  - Update notification targeting to use USN
  - Change analytics to group data by USN
  - Update user management to show USN
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [ ] 5.1 Update attendance components
  - Modify AttendanceList to display USN instead of student_id
  - Update AttendanceCard to show USN information
  - Change AttendanceBulkCreator to use USN references
  - Update API calls to send USN data
  - _Requirements: 6.1_

- [ ] 5.2 Update notification components
  - Modify NotificationsList to filter by USN
  - Update NotificationCreator to target users by USN


  - Change notification display to show USN when relevant
  - _Requirements: 6.2_

- [ ] 5.3 Update analytics and dashboard components
  - Modify analytics queries to group by USN
  - Update dashboard to display USN information
  - Change user statistics to reference USN
  - _Requirements: 6.3_

- [ ] 5.4 Update user management components
  - Modify UserManagement to display USN
  - Update UserProfile to show USN information


  - Change user creation forms to collect USN
  - _Requirements: 6.5_

### Phase 6: Data Migration and Sample Data

- [ ] 6. Create migration utilities and sample data
  - Implement data migration script for existing users
  - Create sample USN data for testing


  - Update initialization scripts with USN data
  - _Requirements: 8.1, 8.2, 8.4_

- [ ] 6.1 Update initialization script in backend/init_auth.py
  - Modify default user creation to include USN
  - Update sample user data with proper USN format
  - Ensure migration handles existing data
  - _Requirements: 8.1, 8.2_

- [ ] 6.2 Update authentication utilities in backend/modules/auth/utils.py
  - Modify create_default_admin to include USN
  - Update create_sample_users with USN data
  - Add USN validation utilities
  - _Requirements: 8.1, 8.2_

- [ ] 6.3 Create USN format validation
  - Implement USN format validation functions
  - Add USN generation utilities for testing
  - Create USN format documentation
  - _Requirements: 3.4, 8.5_

### Phase 7: Testing and Validation

- [ ] 7. Comprehensive testing of USN authentication
  - Test registration with USN credentials
  - Validate login flow with USN
  - Verify cross-module USN references
  - Test role-based access with USN tokens
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ]* 7.1 Update authentication tests in backend/tests/test_auth.py
  - Modify test cases to use USN instead of email
  - Add USN validation tests
  - Test token generation with USN
  - Verify password reset with USN
  - _Requirements: 9.1, 9.2_

- [ ]* 7.2 Create integration tests for USN flow
  - Test complete login/logout cycle with USN
  - Verify cross-module data consistency
  - Test API endpoints with USN authentication
  - Validate frontend-backend integration
  - _Requirements: 9.3, 9.4_

- [ ]* 7.3 Performance and security validation
  - Test USN lookup performance
  - Verify security standards are maintained
  - Test concurrent login scenarios
  - Validate token security with USN
  - _Requirements: 10.1, 10.2, 7.4_

### Phase 8: Documentation and Deployment

- [ ] 8. Update documentation and prepare deployment
  - Update API documentation for USN endpoints
  - Create migration guide for administrators
  - Update user documentation for USN login
  - Prepare deployment scripts
  - _Requirements: 8.5, 9.5_

- [ ]* 8.1 Update API documentation
  - Modify OpenAPI specs for USN authentication
  - Update endpoint documentation
  - Add USN format examples
  - Document migration process
  - _Requirements: 8.5_

- [ ]* 8.2 Create user and admin documentation
  - Write USN login guide for users
  - Create migration guide for administrators
  - Document USN format standards
  - Update troubleshooting guides
  - _Requirements: 8.5, 9.5_

## Success Criteria

- [ ] All users can login using USN and password
- [ ] Registration requires USN as primary identifier
- [ ] All modules reference users by USN consistently
- [ ] Existing functionality is preserved
- [ ] Security standards are maintained
- [ ] Performance meets existing benchmarks
- [ ] Migration preserves all user data