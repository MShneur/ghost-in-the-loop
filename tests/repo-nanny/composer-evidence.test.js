/**
 * PRE-DISPATCH COMPOSER EVIDENCE
 *
 * A successful injection API call is not proof that a framework-controlled
 * editor retained the intended prompt. These tests keep the journal closed
 * unless the complete staged text can be observed in the actual composer.
 */

describe('composer staging evidence', () => {
  test('accepts the complete prompt despite harmless whitespace representation changes', () => {
    const input = document.createElement('textarea');
    input.value = 'Continue.\n\n  Finish the verification. ';
    document.body.appendChild(input);

    expect(_promptStagedInComposer(input, 'Continue. Finish the verification.')).toBe(true);
    input.remove();
  });

  test('rejects a partial prompt even when its beginning looks correct', () => {
    const input = document.createElement('textarea');
    input.value = 'Continue. Finish';
    document.body.appendChild(input);

    expect(_promptStagedInComposer(input, 'Continue. Finish the verification.')).toBe(false);
    input.remove();
  });

  test('reads contenteditable text instead of a misleading value property', () => {
    const input = document.createElement('div');
    input.setAttribute('contenteditable', 'true');
    input.textContent = 'Old user draft';
    Object.defineProperty(input, 'value', { configurable: true, value: 'Expected Ghost prompt' });
    document.body.appendChild(input);

    expect(_composerText(input)).toBe('Old user draft');
    expect(_promptStagedInComposer(input, 'Expected Ghost prompt')).toBe(false);
    input.remove();
  });

  test('accepts a complete multiline prompt rendered as contenteditable block nodes', () => {
    const input = document.createElement('div');
    input.setAttribute('contenteditable', 'true');
    input.innerHTML = '<p>Start the scheduled worker.</p><p>Read the GitHub assignment.</p>';
    Object.defineProperty(input, 'innerText', {
      configurable: true,
      value: 'Start the scheduled worker.\nRead the GitHub assignment.'
    });
    document.body.appendChild(input);

    expect(input.textContent).toBe('Start the scheduled worker.Read the GitHub assignment.');
    expect(_promptStagedInComposer(
      input,
      'Start the scheduled worker.\nRead the GitHub assignment.'
    )).toBe(true);
    input.remove();
  });

  test('rejects detached composers and empty expected prompts', () => {
    const input = document.createElement('textarea');
    input.value = 'Expected Ghost prompt';

    expect(_promptStagedInComposer(input, 'Expected Ghost prompt')).toBe(false);
    document.body.appendChild(input);
    expect(_promptStagedInComposer(input, '')).toBe(false);
    input.remove();
  });
});
