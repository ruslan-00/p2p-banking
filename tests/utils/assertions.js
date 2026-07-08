function softExpect(fn, customMessage, errors = global.errors) {
  try {
    fn();
    if (Array.isArray(global.softAssertResults)) {
      global.softAssertResults.push({ label: customMessage || null, status: 'passed' });
    }
  } catch (err) {
    const originalMsg =
      err.matcherResult && typeof err.matcherResult.message === 'function'
        ? err.matcherResult.message()
        : err.message;

    const msg = customMessage
      ? `${customMessage}\n${originalMsg}`
      : originalMsg;

    errors.push(msg);
    if (Array.isArray(global.softAssertResults)) {
      global.softAssertResults.push({ label: customMessage || null, status: 'failed', error: msg });
    }
  }
}

function flushSoftAsserts(errors = global.errors) {
  if (errors.length > 0) {
    const msg = 'Multiple assertion errors:\n\n' + errors.join('\n\n');
    const e = new Error(msg);
    e.stack = msg;
    throw e;
  }
}

module.exports = { softExpect, flushSoftAsserts };
