export const safeParseJson = (input: string) => {
    const trimmed = input?.trim();

    // 1) fenced code block ```json ... ```
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenced) {
        try { return JSON.parse(fenced[1].trim()); } catch (e) { /* continue */ }
    }

    // 2) plain JSON
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try { return JSON.parse(trimmed); } catch (e) { /* continue */ }
    }

    // 3) extract first {...} span
    const first = input.indexOf('{');
    const last = input.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
        const candidate = input.slice(first, last + 1);
        try { return JSON.parse(candidate); } catch (e) { /* continue */ }
    }

    // 4) remove backticks and try again
    const noTicks = input.replace(/```/g, '').trim();
    try { return JSON.parse(noTicks); } catch (e) { /* continue */ }

    throw new SyntaxError('No valid JSON found in model output.');
}