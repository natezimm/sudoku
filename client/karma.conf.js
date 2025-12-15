module.exports = function (config) {
  const isCI = !!process.env.CI;
  const coverageCheck = isCI
    ? {
        global: {
          lines: 90,
          statements: 85,
          functions: 85,
          branches: 80
        }
      }
    : undefined;

  config.set({
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],

    reporters: ['progress', 'kjhtml', 'coverage'],

    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
      }
    },

    coverageReporter: {
      dir: require('path').join(__dirname, './coverage'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' }
      ],
      check: coverageCheck
    },

    browsers: [isCI ? 'ChromeHeadlessCI' : 'Chrome'],
    singleRun: isCI
  });
};
