# Issue Management for Junior Engineers

This directory contains work instructions and issue templates specifically designed for junior engineers working on the Tosho-in Wariate-kun project.

## Quick Start

### For Project Managers/Senior Developers

1. **Copy the template**: Use `ISSUE-TEMPLATE.md` as a starting point
2. **Create issue file**: Name it `ISSUE-XXX-descriptive-title.md`
3. **Fill requirements**: Complete all sections with specific requirements
4. **Review and assign**: Review with team lead before assignment

### For Junior Engineers

1. **Find your assigned issue**: Look for files with your GitHub username
2. **Read thoroughly**: Understand all requirements and resources
3. **Ask questions**: Clarify anything unclear before starting
4. **Update progress**: Document work in the "Implementation Results" section
5. **Submit for review**: Create PR and update issue file

## Directory Contents

### Core Files

- **`CLAUDE.md`** - Complete guidelines and best practices
- **`ISSUE-TEMPLATE.md`** - Standard template for new issues
- **`README.md`** - This quick reference guide

### Issue Files

- **`ISSUE-001-*.md`** - Individual work assignments
- **`ISSUE-002-*.md`** - Follow numerical sequence
- **`ISSUE-XXX-*.md`** - Each issue gets unique number

## Issue File Lifecycle

### 1. Creation Phase

```markdown
Senior Developer → Creates issue file → Reviews requirements → Assigns to junior engineer
```

### 2. Development Phase

```markdown
Junior Engineer → Reads requirements → Implements solution → Updates issue file → Creates PR
```

### 3. Review Phase

```markdown
Senior Developer → Reviews code → Provides feedback → Junior engineer addresses feedback
```

### 4. Completion Phase

```markdown
Code approved → PR merged → Issue file finalized → Lessons learned documented
```

## File Naming Convention

```
ISSUE-XXX-descriptive-title.md

Examples:
ISSUE-001-setup-frontend-routing.md
ISSUE-002-create-user-login-form.md
ISSUE-003-implement-schedule-api.md
ISSUE-004-add-unit-tests-user-service.md
```

## Priority Levels

### High Priority

- **Blockers**: Issues blocking other work
- **Critical Bugs**: Production issues
- **Release Dependencies**: Required for upcoming releases

### Medium Priority

- **Features**: New functionality development
- **Enhancements**: Improvements to existing features
- **Documentation**: Important documentation updates

### Low Priority

- **Minor Bugs**: Non-critical issues
- **Cleanup**: Code refactoring and cleanup
- **Nice-to-Have**: Optional improvements

## Difficulty Levels

### Beginner (0-6 months experience)

- **Simple Components**: Basic UI components
- **Configuration**: Setup and configuration tasks
- **Documentation**: Writing documentation
- **Bug Fixes**: Simple, well-defined bugs

### Intermediate (6-18 months experience)

- **Feature Implementation**: Complete features
- **API Development**: REST endpoints
- **State Management**: Complex state handling
- **Integration**: Connecting different systems

## Task Categories

### Frontend Tasks

- React component development
- UI/UX implementation
- State management
- Testing and validation
- Responsive design

### Backend Tasks

- API endpoint creation
- Database schema design
- Business logic implementation
- Authentication and authorization
- Testing and validation

### Full-Stack Tasks

- End-to-end feature implementation
- API integration
- Data flow implementation
- System integration testing

### DevOps/Configuration

- Build system setup
- Testing framework configuration
- Development environment setup
- Documentation generation

## Quality Standards

### Code Quality

- **ESLint compliance**: No linting errors
- **TypeScript**: Proper type definitions
- **Testing**: Minimum 90% coverage
- **Documentation**: Inline comments and README updates

### Implementation Quality

- **Functionality**: Meets all acceptance criteria
- **Performance**: Follows performance best practices
- **Security**: Follows security guidelines
- **Accessibility**: Meets accessibility standards

### Process Quality

- **Communication**: Regular updates and questions
- **Version Control**: Clean, descriptive commits
- **Code Review**: Responsive to feedback
- **Documentation**: Thorough result documentation

## Common Issue Types

### Setup Issues

```markdown
ISSUE-001-setup-development-environment.md
ISSUE-002-configure-eslint-prettier.md
ISSUE-003-setup-testing-framework.md
```

### Component Issues

```markdown
ISSUE-010-create-header-component.md
ISSUE-011-implement-login-form.md
ISSUE-012-build-schedule-calendar.md
```

### API Issues

```markdown
ISSUE-020-create-user-endpoints.md
ISSUE-021-implement-authentication.md
ISSUE-022-build-schedule-api.md
```

### Testing Issues

```markdown
ISSUE-030-add-component-tests.md
ISSUE-031-create-api-integration-tests.md
ISSUE-032-implement-e2e-tests.md
```

## Success Metrics

### Individual Progress

- **Completion Rate**: Percentage of issues completed
- **Quality Score**: Code review feedback ratings
- **Time Accuracy**: Estimation vs actual time
- **Independence**: Reduced need for guidance

### Learning Outcomes

- **Technical Skills**: New technologies learned
- **Problem Solving**: Debugging and troubleshooting
- **Code Quality**: Improvement in code standards
- **Communication**: Better requirement understanding

### Project Impact

- **Feature Delivery**: Contribution to project milestones
- **Bug Resolution**: Issues resolved and prevented
- **Documentation**: Knowledge base improvements
- **Team Collaboration**: Positive team interactions

## Getting Help

### Immediate Support

- **Slack/Teams**: Real-time communication
- **GitHub Issues**: Technical discussions
- **Pair Programming**: Screen sharing sessions
- **Office Hours**: Scheduled help sessions

### Learning Resources

- **Project Documentation**: Internal knowledge base
- **External Tutorials**: Curated learning materials
- **Code Examples**: Reference implementations
- **Video Resources**: Recorded explanations

### Escalation Process

1. **Self-research**: Try to solve independently first
2. **Documentation**: Check project docs and resources
3. **Team Chat**: Ask in team communication channels
4. **Direct Mentor**: Contact assigned senior developer
5. **Team Lead**: Escalate to project lead if needed

## Best Practices

### For Issue Creators

- **Clear Requirements**: Unambiguous task definitions
- **Appropriate Scope**: Achievable in estimated time
- **Learning Opportunities**: Include skill development
- **Quality Resources**: Provide adequate learning materials

### For Issue Assignees

- **Read Completely**: Understand all requirements first
- **Ask Early**: Clarify unclear points before starting
- **Update Regularly**: Keep issue file current with progress
- **Test Thoroughly**: Verify all functionality works
- **Document Learning**: Capture new knowledge gained

### For Reviewers

- **Timely Feedback**: Respond promptly to pull requests
- **Constructive Criticism**: Focus on learning and improvement
- **Teaching Moments**: Explain reasoning behind feedback
- **Encouragement**: Recognize good work and progress

This issue management system ensures junior engineers receive appropriate, well-structured tasks that contribute to both their professional development and project success.
