import type { Handle } from "@sveltejs/kit";
import {
	baseLocale,
	cookieName,
	getTextDirection,
	locales,
} from "$lib/paraglide/runtime";
import { paraglideMiddleware } from "$lib/paraglide/server";

type Locale = (typeof locales)[number];

function isSupportedLocale(locale: string): locale is Locale {
	return locales.some((supportedLocale) => supportedLocale === locale);
}

function detectPreferredLocale(acceptLanguageHeader: string | null) {
	if (!acceptLanguageHeader) return undefined;

	const requestedLanguages = acceptLanguageHeader
		.split(",")
		.map((part) => part.split(";")[0]?.trim().toLowerCase())
		.filter(Boolean);

	for (const language of requestedLanguages) {
		if (isSupportedLocale(language)) {
			return language;
		}

		const matchedLocale = locales.find(
			(locale) =>
				language === locale ||
				language.startsWith(`${locale.split("-")[0]}-`) ||
				locale.startsWith(`${language}-`),
		);

		if (matchedLocale) {
			return matchedLocale;
		}
	}

	return undefined;
}

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) =>
				html
					.replace("%paraglide.lang%", locale)
					.replace("%paraglide.dir%", getTextDirection(locale)),
		});
	});

const handlePreferredLocaleRedirect: Handle = async ({ event, resolve }) => {
	const requestUrl = new URL(event.request.url);
	const pathname = requestUrl.pathname;
	const hasLocalePrefix = locales.some(
		(locale) =>
			locale !== baseLocale &&
			(pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)),
	);
	const hasLocaleCookie = Boolean(event.cookies.get(cookieName));
	const isDocumentRequest =
		event.request.method === "GET" &&
		event.request.headers.get("accept")?.includes("text/html");

	if (!hasLocalePrefix && !hasLocaleCookie && isDocumentRequest) {
		const preferredLocale = detectPreferredLocale(
			event.request.headers.get("accept-language"),
		);

		if (preferredLocale && preferredLocale !== baseLocale) {
			const redirectUrl = new URL(event.request.url);
			redirectUrl.pathname = `/${preferredLocale}${pathname === "/" ? "" : pathname}`;
			return Response.redirect(redirectUrl, 307);
		}
	}

	return resolve(event);
};

export const handle: Handle = async ({ event, resolve }) => {
	return handlePreferredLocaleRedirect({
		event,
		resolve: (nextEvent) => handleParaglide({ event: nextEvent, resolve }),
	});
};
