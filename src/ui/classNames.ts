// Joins the class names that are switched on
export function classNames(...names: (string | false | null | undefined)[]): string {
    return names.filter(Boolean).join(" ")
}

// Category names as CSS classes ("Common work" -> "Commonwork")
export function removeSpaces(string: string): string {
    return string.replace(/ /g, "")
}
