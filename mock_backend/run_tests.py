import unittest
import coverage
import os
import sys

def run_tests_with_coverage():
    """Run all tests with coverage reporting."""
    # Start coverage measurement
    cov = coverage.Coverage(
        source=['schedule_generator_class.py', 'init_database.py'],
        omit=['*/tests/*', '*/venv/*', '*/site-packages/*']
    )
    cov.start()

    # Discover and run tests
    loader = unittest.TestLoader()
    tests_dir = os.path.join(os.path.dirname(__file__), 'tests')
    suite = loader.discover(tests_dir)
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Stop coverage measurement
    cov.stop()
    cov.save()
    
    # Print coverage report to console
    print("\nCoverage Summary:")
    cov.report()
    
    # Generate HTML report
    html_dir = os.path.join(os.path.dirname(__file__), 'coverage_html')
    cov.html_report(directory=html_dir)
    print(f"\nHTML coverage report generated in: {html_dir}")
    
    # Generate XML report for CI/CD integration
    xml_file = os.path.join(os.path.dirname(__file__), 'coverage.xml')
    cov.xml_report(outfile=xml_file)
    print(f"XML coverage report generated: {xml_file}")
    
    return result

if __name__ == '__main__':
    result = run_tests_with_coverage()
    # Return non-zero exit code if tests failed
    sys.exit(not result.wasSuccessful())
