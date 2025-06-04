export function Template(tmpl: string, vars: Record<string, string> = {}) {
	return new Function(...Object.keys(vars), `return \`${tmpl}\`;`)(...Object.values(vars))
}
