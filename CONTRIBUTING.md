# Contributing to Hex Address

Thank you for your interest in contributing! This guide will help you get started.

## 🚀 Quick Start

1. **Fork** the repository
2. **Clone** your fork locally
3. **Install** dependencies for both Python and JavaScript packages
4. **Make** your changes
5. **Test** your changes
6. **Submit** a pull request

## 🏗️ Development Setup

### Python Package
```bash
cd python
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -e ".[dev]"
```

### JavaScript Package
```bash
cd javascript
npm install
```

## 🧪 Testing

### Python Tests
```bash
cd python
pytest
pytest --cov=h3_syllable  # With coverage
```

### JavaScript Tests
```bash
cd javascript
npm test
npm run test:coverage  # With coverage
```

### Cross-Package Testing
```bash
# Test that both packages produce identical results
python tools/scripts/cross_package_test.py
```

## 📝 Code Style

### Python
- Use `black` for formatting
- Use `ruff` for linting
- Use type hints
- Follow PEP 8

```bash
cd python
black src tests
ruff check src tests
mypy src
```

### JavaScript
- Use `prettier` for formatting
- Use `eslint` for linting
- Use TypeScript
- Follow the existing style

```bash
cd javascript
npm run lint:fix
npm run type-check
```

## 🎯 Types of Contributions

### 🐛 Bug Reports
- Use the issue template
- Include reproduction steps
- Test with both Python and JavaScript packages

### ✨ Feature Requests
- Describe the use case
- Consider impact on both packages
- Discuss API design first

### 🔧 Code Contributions
- Fork and create a feature branch
- Write tests for new functionality
- Update documentation
- Ensure both packages work identically

### 📚 Documentation
- Update README files
- Add examples
- Improve API documentation
- Fix typos and clarity

## 🛠️ Development Guidelines

### Coordinate System Consistency
- Both Python and JavaScript packages must produce identical results
- All coordinates must round-trip accurately
- Validation logic must be consistent

### Configuration Management
- Configurations are shared between packages via JSON files
- New configurations must be tested with both packages
- Follow the naming convention: `language-consonants-vowels-maxconsecutive`

### Testing Requirements
- All new features need tests
- Maintain >90% code coverage
- Include integration tests
- Test edge cases (invalid coordinates, non-existent addresses)

### API Design
- Keep APIs similar between Python and JavaScript
- Use clear, descriptive function names
- Provide good error messages
- Include type annotations/definitions

## 📋 Pull Request Process

1. **Create** a feature branch from `main`
2. **Make** your changes
3. **Add** tests for new functionality
4. **Run** the full test suite
5. **Update** documentation if needed
6. **Submit** a pull request with:
   - Clear description of changes
   - Link to any related issues
   - Screenshots for UI changes
   - Test results

### PR Checklist
- [ ] Tests pass for both Python and JavaScript
- [ ] Code follows style guidelines
- [ ] Documentation is updated
- [ ] No breaking changes (or marked as such)
- [ ] Commit messages are descriptive

## 🔄 Release Process

Releases are automated via GitHub Actions:

1. **Version bumping** happens automatically
2. **Testing** runs on multiple platforms
3. **Building** creates packages for PyPI and NPM
4. **Publishing** is automated for tagged releases

## 🤝 Community Guidelines

### Be Respectful
- Use inclusive language
- Be patient with beginners
- Provide constructive feedback

### Be Helpful
- Answer questions in issues
- Review pull requests
- Share knowledge and examples

### Be Collaborative
- Discuss major changes first
- Consider backward compatibility
- Think about maintenance burden

## 🎨 Adding New Language Configurations

To add a new language configuration:

1. **Research** the target language's phonology
2. **Select** appropriate consonants and vowels
3. **Create** a JSON configuration file
4. **Test** the configuration with real data
5. **Document** the language-specific choices
6. **Add** examples in the language

Example configuration:
```json
{
  "name": "Language Name",
  "description": "Description with syllable count and constraints",
  "consonants": ["b", "d", "f", "g", "k", "l", "m", "n", "p", "t"],
  "vowels": ["a", "e", "i", "o", "u"],
  "address_length": 8,
  "max_consecutive": 2,
  "h3_resolution": 15
}
```

## 🐞 Debugging Tips

### Python
```bash
cd python
python -m pdb src/h3_syllable/h3_syllable_system.py
```

### JavaScript
```bash
cd javascript
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Cross-Package Issues
```bash
# Compare outputs
python python/examples/basic_usage.py > python_output.txt
node javascript/examples/basic_usage.js > js_output.txt
diff python_output.txt js_output.txt
```

## 📬 Getting Help

- **Discord**: [Project Discord](https://discord.gg/your-invite)
- **Issues**: Use GitHub issues for bugs and features
- **Discussions**: Use GitHub discussions for questions
- **Email**: maintainers@hex-address.org

## 🏆 Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- Package metadata
- Annual contributor spotlight

Thank you for contributing to H3 Syllable! 🎉