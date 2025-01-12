const EmoijRegex =
	/((\p{Extended_Pictographic}|\p{Emoji_Modifier}|\p{Emoji_Modifier_Base}|\u200D)+)/gu;

function withVariationSelector(text: string, color = false) {
	// Strip the presentation selectors from the string.
	const withoutPresentation = text.replaceAll(/(\uFE0F|\uFE0E)/gu, '');
	// Choose the appropriate presentation selector (FE0F is color, FE0E is mono).
	const selector = color ? '\uFE0F' : '\uFE0E';
	// Replace all sequences of emoji, emoji modifier bases, emoji modifiers, and zero width joiners.
	// Nearly arbitrary sequences of these can be composed to determine the presentation of a sequence
	// of code points, and they can be terminated by a presentation selector, so we match the whole
	// sequence, and append the selector to the end.
	// For the standard details, see: https://www.unicode.org/reports/tr51/
	return withoutPresentation.replaceAll(EmoijRegex, `$1${selector}`);
}

export const DraftSymbol = withVariationSelector('🚧', false);
export const PersonSymbol = '⍜';
export const RoleSymbol = '⚙';
export const ProcessSymbol = '☑';
export const OrganizationSymbol = '▦';
export const TeamSymbol = '𑗕';
