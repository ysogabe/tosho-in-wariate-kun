# Issue Management Guidelines

This directory contains work instructions and issue templates specifically designed for junior engineers working on the Tosho-in Wariate-kun project.

## Overview

The `docs/issues/` directory serves as a centralized location for creating, managing, and tracking work assignments that are appropriate for junior-level developers. Each issue file contains detailed task definitions, acceptance criteria, and space for recording implementation results.

## Directory Purpose

### Primary Functions
- **Task Definition**: Clear, actionable work instructions for junior engineers
- **Skill Development**: Appropriately scoped tasks for learning and growth
- **Result Tracking**: Space to document implementation outcomes and learnings
- **GitHub Integration**: Templates ready for GitHub Issue creation

### Target Audience
- **Junior Engineers**: Developers with 0-2 years of experience
- **Bootcamp Graduates**: Recent coding bootcamp completers
- **Interns**: Student developers and interns
- **New Team Members**: Developers new to the project or technology stack

## Issue File Structure

### File Naming Convention
```
ISSUE-XXX-descriptive-title.md

Examples:
ISSUE-001-setup-eslint-configuration.md
ISSUE-002-create-user-login-component.md
ISSUE-003-implement-schedule-validation.md
```

### Required File Sections

#### 1. Issue Header
```markdown
# Issue #XXX: [Descriptive Title]

**Priority**: Low | Medium | High
**Difficulty**: Beginner | Intermediate 
**Estimated Time**: X hours/days
**Type**: Bug Fix | Feature | Documentation | Refactor
**Labels**: frontend, backend, testing, documentation
```

#### 2. Task Description
```markdown
## Description
Clear, concise description of what needs to be accomplished.

## Background
Context and reasoning behind the task.

## Acceptance Criteria
- [ ] Specific, measurable criteria for task completion
- [ ] Each criterion should be testable
- [ ] Include both functional and non-functional requirements
```

#### 3. Implementation Guidance
```markdown
## Implementation Guidelines

### Getting Started
1. Step-by-step setup instructions
2. Required dependencies or tools
3. Relevant documentation links

### Technical Requirements
- Specific technologies to use
- Code style guidelines
- Testing requirements

### Resources
- Links to relevant documentation
- Example code or similar implementations
- Tutorial or learning resources
```

#### 4. Result Documentation
```markdown
## Implementation Results

### Work Completed
- [ ] Detailed list of completed tasks
- [ ] Links to pull requests or commits
- [ ] Screenshots or demos (if applicable)

### Challenges Faced
- Technical obstacles encountered
- How challenges were overcome
- Lessons learned

### Testing Results
- Test coverage achieved
- Test results summary
- Quality assurance validation

### Code Review Feedback
- Peer review comments
- Changes made based on feedback
- Final approval status
```

## Issue Categories

### Frontend Issues
- **Component Development**: Creating reusable UI components
- **Page Implementation**: Building application pages and routes
- **Styling Tasks**: CSS/TailwindCSS implementation
- **State Management**: React Context or state handling
- **Testing**: Component and integration testing

### Backend Issues  
- **API Development**: Creating REST endpoints
- **Database Tasks**: Schema design and migrations
- **Service Implementation**: Business logic development
- **Authentication**: Login and security features
- **Testing**: Unit and integration testing

### Documentation Issues
- **API Documentation**: OpenAPI/Swagger documentation
- **User Guides**: End-user documentation
- **Developer Docs**: Technical documentation
- **README Updates**: Project documentation maintenance

### Configuration Issues
- **Development Setup**: Environment configuration
- **Tool Configuration**: ESLint, TypeScript, build tools
- **CI/CD**: GitHub Actions and deployment setup
- **Package Management**: Dependency management

## Work Assignment Process

### 1. Issue Creation
```markdown
1. Create issue file in `docs/issues/`
2. Fill out all required sections
3. Review with senior developer
4. Assign appropriate labels and priority
```

### 2. GitHub Issue Creation
```markdown
1. Copy issue content to GitHub
2. Assign to junior engineer
3. Add to appropriate project board
4. Set milestone if applicable
```

### 3. Implementation Tracking
```markdown
1. Engineer updates issue file with progress
2. Regular check-ins with mentor/senior developer
3. Code review process
4. Result documentation in issue file
```

### 4. Completion and Review
```markdown
1. Final result documentation
2. Lessons learned capture
3. Code review completion
4. Issue closure and feedback
```

## Quality Standards

### Task Appropriateness
- **Scope**: Tasks should be completable in 1-5 days
- **Complexity**: Appropriate for skill level
- **Learning**: Include opportunities for skill development
- **Support**: Clear guidance and resources provided

### Documentation Requirements
- **Clarity**: Instructions must be clear and unambiguous
- **Completeness**: All necessary information provided
- **Examples**: Include code examples and references
- **Resources**: Links to relevant learning materials

### Result Tracking
- **Detailed Records**: Comprehensive documentation of work done
- **Challenges**: Honest recording of obstacles and solutions
- **Learning**: Capture of new skills and knowledge gained
- **Quality**: Evidence of testing and code review

## Templates

### Basic Issue Template
```markdown
# Issue #XXX: [Title]

**Priority**: Medium
**Difficulty**: Beginner
**Estimated Time**: 2-4 hours
**Type**: Feature
**Labels**: frontend, component

## Description
[Clear description of the task]

## Background
[Context and reasoning]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Implementation Guidelines

### Getting Started
1. [Step 1]
2. [Step 2]

### Technical Requirements
- [Requirement 1]
- [Requirement 2]

### Resources
- [Link 1]
- [Link 2]

## Implementation Results

### Work Completed
- [ ] [Task 1]
- [ ] [Task 2]

### Challenges Faced
[To be filled during implementation]

### Testing Results
[To be filled during implementation]

### Code Review Feedback
[To be filled during review]
```

## Best Practices

### For Issue Creators
1. **Clear Scope**: Define exactly what needs to be done
2. **Appropriate Difficulty**: Match task complexity to skill level
3. **Learning Opportunities**: Include chances for skill development
4. **Resource Provision**: Provide adequate learning materials
5. **Success Criteria**: Define clear completion criteria

### For Issue Assignees
1. **Regular Updates**: Update issue file with progress
2. **Ask Questions**: Seek clarification when needed
3. **Document Challenges**: Record obstacles and solutions
4. **Test Thoroughly**: Ensure quality before submission
5. **Seek Review**: Request code review and feedback

### For Mentors/Reviewers
1. **Timely Feedback**: Provide prompt review and guidance
2. **Constructive Criticism**: Focus on learning and improvement
3. **Encouragement**: Support and motivate junior developers
4. **Knowledge Sharing**: Share relevant experience and tips
5. **Quality Standards**: Maintain code quality while teaching

## Integration with Development Workflow

### TDD Integration
- Issues should include TDD requirements
- Test-first approach encouraged
- Testing guidance provided for each task

### Code Review Process
- All issue implementations require code review
- Review feedback documented in issue file
- Learning opportunities highlighted during review

### Documentation Updates
- Issues may require documentation updates
- Changes to project docs tracked in issue files
- Knowledge base continuously improved

## Success Metrics

### Individual Development
- **Task Completion**: Percentage of issues completed successfully
- **Quality Metrics**: Code review feedback scores
- **Learning Progress**: Skills developed through issue work
- **Independence**: Reduction in guidance needed over time

### Project Benefits
- **Knowledge Distribution**: More team members familiar with codebase
- **Code Quality**: Maintained through guided development
- **Documentation**: Improved through issue-driven updates
- **Team Growth**: Development of junior engineers into productive contributors

## Support and Resources

### Getting Help
- **Mentorship**: Assigned senior developer for guidance
- **Team Chat**: Real-time communication channels
- **Office Hours**: Scheduled time for questions and support
- **Documentation**: Comprehensive project documentation

### Learning Resources
- **Internal Docs**: Project-specific documentation
- **External Tutorials**: Curated learning materials
- **Code Examples**: Reference implementations
- **Best Practices**: Team coding standards and guidelines

This issue management system ensures that junior engineers receive appropriate, well-defined tasks that contribute to both their professional development and the project's success.