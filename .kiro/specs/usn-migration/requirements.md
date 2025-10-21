# Requirements Document - USN-Based Authentication Migration

## Introduction

This specification outlines the migration of the EduSync Classroom Management System from email-based authentication to USN (University Seat Number) based authentication. The migration will make USN the primary unique identifier across the entire system while maintaining all existing security features and functionality.

## Glossary

- **USN**: University Seat Number - A unique academic identifier for students (e.g., "1MS21CS001")
- **Authentication System**: The login/logout and user verification system
- **User Model**: Database model representing system users
- **Token**: JWT token used for session management
- **Password Hash**: Encrypted password storage using pbkdf2_sha256

## Requirements

### Requirement 1: Database Schema Migration

**User Story:** As a system administrator, I want the User model to use USN as the primary identifier, so that the system aligns with academic standards.

#### Acceptance Criteria

1. WHEN the User model is updated, THE system SHALL include a USN field as unique and indexed
2. WHEN a user is created, THE system SHALL require USN as a non-nullable field
3. WHEN the database is migrated, THE system SHALL maintain email as optional information
4. WHEN USN is stored, THE system SHALL enforce uniqueness constraints
5. WHERE backward compatibility is needed, THE system SHALL preserve existing user data during migration

### Requirement 2: Authentication Logic Transformation

**User Story:** As a user, I want to login using my USN and password, so that I can access the system with my academic credentials.

#### Acceptance Criteria

1. WHEN a user attempts to login, THE system SHALL authenticate using USN and password combination
2. WHEN login credentials are verified, THE system SHALL fetch user by USN instead of email
3. WHEN authentication succeeds, THE system SHALL generate JWT tokens containing USN
4. WHEN password verification occurs, THE system SHALL continue using secure hashing
5. IF invalid USN or password is provided, THEN THE system SHALL return appropriate error messages

### Requirement 3: Registration Process Update

**User Story:** As a new user, I want to register using my USN and password, so that I can create an account with my academic identifier.

#### Acceptance Criteria

1. WHEN a user registers, THE system SHALL require USN and password as mandatory fields
2. WHEN USN is submitted, THE system SHALL verify uniqueness before account creation
3. WHEN password is provided, THE system SHALL hash it before storage
4. WHEN registration is successful, THE system SHALL create user with USN as primary identifier
5. IF USN already exists, THEN THE system SHALL prevent duplicate registration

### Requirement 4: Password Management Migration

**User Story:** As a user, I want to reset my password using my USN, so that I can recover access to my account.

#### Acceptance Criteria

1. WHEN password reset is requested, THE system SHALL identify user by USN
2. WHEN new password is set, THE system SHALL hash and store it securely
3. WHEN password is updated, THE system SHALL maintain existing security standards
4. IF USN is not found, THEN THE system SHALL return appropriate error message
5. WHERE password policies exist, THE system SHALL continue enforcing them

### Requirement 5: Frontend Interface Updates

**User Story:** As a user, I want the login and registration forms to use USN fields, so that the interface matches the new authentication method.

#### Acceptance Criteria

1. WHEN login form is displayed, THE system SHALL show USN and password fields
2. WHEN registration form is shown, THE system SHALL collect USN as primary identifier
3. WHEN API calls are made, THE system SHALL send USN-based credentials
4. WHEN user session is stored, THE system SHALL use USN for identification
5. WHERE user information is displayed, THE system SHALL show USN appropriately

### Requirement 6: Cross-Module USN Integration

**User Story:** As a system user, I want all modules to reference users by USN, so that there is consistency across attendance, timetable, and analytics.

#### Acceptance Criteria

1. WHEN attendance is recorded, THE system SHALL reference students by USN
2. WHEN notifications are sent, THE system SHALL target users by USN
3. WHEN analytics are generated, THE system SHALL group data by USN
4. WHEN timetable is managed, THE system SHALL associate professors by USN
5. WHERE user references exist, THE system SHALL use USN consistently

### Requirement 7: Security and Token Management

**User Story:** As a security-conscious user, I want the authentication tokens to include USN, so that session management remains secure with the new identifier.

#### Acceptance Criteria

1. WHEN JWT tokens are created, THE system SHALL include USN in payload
2. WHEN tokens are verified, THE system SHALL extract USN for user identification
3. WHEN session validation occurs, THE system SHALL use USN for user lookup
4. WHEN role-based access is checked, THE system SHALL maintain existing security levels
5. WHERE token expiration is handled, THE system SHALL preserve existing timeout logic

### Requirement 8: Data Migration and Backward Compatibility

**User Story:** As a system administrator, I want existing data to be preserved during migration, so that no user information is lost.

#### Acceptance Criteria

1. WHEN migration is performed, THE system SHALL preserve all existing user accounts
2. WHEN USN is not available for existing users, THE system SHALL provide migration strategy
3. WHEN data integrity is checked, THE system SHALL ensure no data loss occurs
4. WHEN references are updated, THE system SHALL maintain relational consistency
5. WHERE conflicts arise, THE system SHALL provide resolution mechanisms

### Requirement 9: Testing and Validation

**User Story:** As a quality assurance tester, I want comprehensive testing of USN authentication, so that the system works reliably after migration.

#### Acceptance Criteria

1. WHEN registration is tested, THE system SHALL successfully create USN-based accounts
2. WHEN login is tested, THE system SHALL authenticate users with USN credentials
3. WHEN logout is tested, THE system SHALL properly invalidate USN-based sessions
4. WHEN role-based access is tested, THE system SHALL maintain proper permissions
5. WHERE edge cases exist, THE system SHALL handle them gracefully

### Requirement 10: Performance and Scalability

**User Story:** As a system user, I want USN-based authentication to perform as well as email-based authentication, so that system responsiveness is maintained.

#### Acceptance Criteria

1. WHEN USN lookups are performed, THE system SHALL maintain sub-500ms response times
2. WHEN database queries use USN, THE system SHALL utilize proper indexing
3. WHEN concurrent logins occur, THE system SHALL handle load efficiently
4. WHEN large datasets are processed, THE system SHALL maintain performance standards
5. WHERE bottlenecks exist, THE system SHALL provide optimization opportunities