# Contributing to Znak Lavki

First off, thank you for considering contributing to Znak Lavki! It's people like you that make it such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* **Use a clear and descriptive title**
* **Describe the exact steps which reproduce the problem**
* **Provide specific examples to demonstrate the steps**
* **Describe the behavior you observed after following the steps**
* **Explain which behavior you expected to see instead and why**
* **Include screenshots and animated GIFs if possible**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* **Use a clear and descriptive title**
* **Provide a step-by-step description of the suggested enhancement**
* **Provide specific examples to demonstrate the steps**
* **Describe the current behavior and explain which behavior you expected to see instead**
* **Explain why this enhancement would be useful**

### Pull Requests

* Fill in the required template
* Do not include issue numbers in the PR title
* Follow the TypeScript styleguide
* Include thoughtfully-worded, well-structured tests
* Document new code
* End all files with a newline

## Development Process

1. Fork the repo and create your branch from `main`
2. Install dependencies: `pnpm install`
3. Make your changes
4. Add tests if applicable
5. Ensure the test suite passes: `pnpm test`
6. Make sure your code lints: `pnpm lint`
7. Format your code: `pnpm format`
8. Commit your changes using conventional commits
9. Push to your fork and submit a pull request

## Styleguides

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line
* Follow conventional commits specification:
  * `feat:` - A new feature
  * `fix:` - A bug fix
  * `docs:` - Documentation only changes
  * `style:` - Changes that don't affect code meaning
  * `refactor:` - Code change that neither fixes a bug nor adds a feature
  * `perf:` - Code change that improves performance
  * `test:` - Adding missing tests
  * `chore:` - Changes to the build process or auxiliary tools

### TypeScript Styleguide

* Use TypeScript for all new code
* Follow the existing code style
* Use meaningful variable names
* Add JSDoc comments for public APIs
* Avoid using `any` type when possible
* Use strict type checking

### Testing Styleguide

* Write tests for all new features
* Ensure tests are readable and maintainable
* Use descriptive test names
* Follow the AAA pattern (Arrange, Act, Assert)
* Mock external dependencies

## Project Structure

* `apps/` - Frontend applications
* `services/` - Backend microservices
* `packages/` - Shared packages
* `.github/` - GitHub workflows and templates
* `docker/` - Docker configuration files

## Setting Up Your Development Environment

See the [README.md](README.md) file for detailed setup instructions.

## Questions?

Feel free to create an issue with the question label, and we'll do our best to help!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.


