<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Application architecture
- Keep prototype data and document operations in a shared React context mounted in the root layout so navigation preserves session state.
- Persist demo state only in browser localStorage after hydration, with versioned validation and a recoverable reset; this prototype intentionally has no server-side business logic.
- Use separate TanStack content routes for each navigation destination and shared workspace components for a consistent desktop shell.
- Calculate document amounts from line items through shared pure helpers so editor, lists, details and summary metrics remain consistent.
