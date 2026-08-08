# Host-Affixed Mobile Ghost Shell Concepts

Status: exploratory worker brief with a user-confirmed mounting requirement; not yet an accepted product implementation.

Source: user-supplied annotated Android screenshot and follow-up clarification, 2026-08-06.

## Core requirement

Ghost should not float above the site as a fixed overlay for these concepts. It should inspect each supported site's existing row-and-column structure and attach Ghost controls into that structure so the host page lays them out as part of its own interface.

“Table setup” means the site's logical layout model, whether the DOM uses an actual table, CSS Grid, Flexbox, block rows, a form toolbar, or nested wrappers.

The three concepts are therefore structural mount modes:

1. Teal: append a Ghost menu/action cell to the host header action row.
2. Blue: append a Ghost control cell to the host composer's final action row.
3. Red: insert a Ghost-owned expandable row directly beneath the composer inside the same footer/layout stack.

Ghost may use a custom element and Shadow DOM to isolate its internal styles, but that custom element must remain an in-flow child or sibling of the host layout. Shadow DOM isolation does not make it an overlay.

## Product intent

The user wants Ghost to “hijack” the site's layout in a controlled, reversible way:

- Discover the host's stable row or column container.
- Add Ghost as another real cell or row.
- Let the site reflow around Ghost.
- Keep Ghost attached when the host adds, removes, or rerenders controls.
- Expand the red menu by increasing the host footer's height, pushing chat content upward rather than covering it.
- Avoid duplicate controls and avoid intercepting host Send, attachment, voice, or navigation actions.

The mount must look native to the site while preserving Ghost's single state store and existing reviewed action authority.

## Structural mount model

Each supported platform should expose an adapter-owned mount contract rather than one universal selector.

A mount contract should describe:

```js
{
  headerActions: findHeaderActionRow,
  composerActions: findComposerActionRow,
  composerStack: findComposerFooterStack,
  verify: verifyStructuralMount,
  repair: repairStructuralMount
}
```

The actual names may differ, but the responsibilities should remain explicit.

### Discovery sequence

1. Locate the known header or composer anchor using the platform adapter.
2. Climb to the nearest stable structural parent whose children represent controls, cells, or rows.
3. Classify its layout as `flex-row`, `grid-row`, `block-stack`, or `table-row`.
4. Verify that adding one child does not replace, wrap, or reorder the host's Send controls.
5. Insert one Ghost custom element at the adapter-defined slot.
6. Re-read layout and verify that the host controls remain visible, connected, and operable.
7. Observe only the nearest structural container for rerenders or child changes.
8. Repair or reattach the existing Ghost element; never create a second one.

### Host additions and rerenders

Blue and teal normally remain the final action cell. If the host appends another native control after Ghost, a scoped observer may move the same Ghost element back to the final adapter-approved position.

Red remains the final row of the composer/footer stack. If the host replaces the composer subtree, Ghost should re-resolve the stack and move the same stateful shell to the replacement mount point.

Do not use a document-wide high-frequency mutation scan.

## Concept A — Teal header cell

### Sketch interpretation

- Ghost logo or menu icon in the upper-right.
- Quick Play/Pause next to it when space allows.
- Placed opposite the site's main hamburger or navigation menu.
- Behaves like another item in the host header menu bar.

### Mount behavior

- Find the host header's action group or final cell.
- Append a Ghost custom element as the last action child.
- Inherit the row's alignment, height, and spacing where safe.
- Do not use `position: fixed` or `position: absolute` for the primary mount.
- Allow the host header to reflow, compress, or move the Ghost cell naturally.

### Strengths

- Looks like a native menu-bar action.
- Remains available when the composer is not visible.
- Lower Send-safety risk than composer mounting.
- Can open the same full Ghost shell used by blue and red.

### Risks

- Header structures vary sharply by platform and responsive breakpoint.
- Some action rows use fixed grid templates or overflow menus.
- Adding a final child may force wrapping or hide host controls.
- A platform-specific adapter may need to place Ghost inside the site's overflow group rather than forcing another visible icon.

### Acceptance requirement

Teal is valid only when insertion causes normal host reflow and no header control becomes hidden, overlapped, or detached.

## Concept B — Blue composer action cell

### Sketch interpretation

- A compact Ghost capsule in the same row as the composer's existing attachment, voice, tool, or Send controls.
- Contains the Ghost mark, Play/Pause, and a `+` or menu expander.
- It is a true member of the composer's control row, not something visually positioned over it.

### Mount behavior

- Find the composer's final stable action row.
- Append one Ghost cell as the final child or final approved grid track.
- Prefer inheriting the existing Flexbox or Grid layout.
- Preserve the host's DOM nodes and event handlers.
- Do not wrap, move, clone, or replace the Send button.
- Do not place Ghost inside the editable text element.
- If the row uses a fixed grid template, an adapter may add one reversible track only after platform-specific certification.
- Record any changed inline style so unmount can restore the original value exactly.

### Host growth behavior

When the site adds a new tool or button:

- The host control stays in the main action row.
- Ghost remains a separate cell.
- The row may wrap, resize, or redistribute according to the site's own layout.
- Ghost may move to the final approved position, but it must not delete or cover the new host control.

### Strengths

- Best one-handed reach.
- Feels native because the site itself positions the control.
- Directly available at task-composition time.
- Can open the red expandable row without introducing a separate panel system.

### Risks

- Highest coupling to host DOM and responsive behavior.
- Composer rerenders may remove the mounted cell.
- Narrow widths may force wrapping or shrink the editable area excessively.
- Failure near Send is more consequential than failure in a separate rail.

### Acceptance requirement

Blue advances only when every supported adapter proves:

- Ghost is in normal document flow.
- Host Send remains the same connected node and remains clickable.
- Attachments, voice, tools, and text editing still work.
- Adding a simulated new host control does not overlap or remove Ghost or host controls.
- Repeated composer replacement produces exactly one Ghost cell.

## Concept C — Red expandable composer row

### Sketch interpretation

- A horizontal Ghost row directly beneath the composer controls.
- Logo at left.
- Quick Play/Pause.
- Numbered top-level sections such as `1 2 3 4`.
- A `+` control to reveal more sections or expand the menu.
- It behaves like another row in the site's composer/footer area.

### Mount behavior

- Find the stable composer/footer stack that owns the composer row.
- Insert the Ghost shell as the next sibling row immediately beneath the composer.
- Keep the shell inside the same sticky footer or bottom layout container when that is how the host is structured.
- Use `display: block`, Grid, or Flexbox as appropriate; do not pin it to the viewport.
- The collapsed row occupies real layout height.
- Expanding the menu increases its block height and therefore expands the host footer upward.
- Chat content should resize, reflow, or gain bottom space rather than being covered.

### “Almost an iframe” interpretation

Use a Ghost custom element with a Shadow DOM interior:

```html
<ghost-composer-row>
  #shadow-root
    Ghost controls and expanded section content
</ghost-composer-row>
```

This gives style and event isolation similar to an embedded component, but it remains a real row in the host page. An actual iframe is not required and would complicate sizing, focus, permissions, and state sharing.

### Expansion behavior

Collapsed:

```text
[ Ghost ] [ ▶/⏸ ] [ 1 ] [ 2 ] [ 3 ] [ 4 ] [ + ]
```

Expanded:

```text
┌──────────────────────────────────────┐
│ Ghost  ▶/⏸  1  2  3  4  +  ×        │
├──────────────────────────────────────┤
│ Selected Ghost section content       │
└──────────────────────────────────────┘
```

The expanded content grows from the bottom row upward as part of the footer stack. It must not cover the composer or message list.

### Strengths

- Excellent thumb reach.
- Clear top-level navigation.
- Native page reflow instead of viewport collision.
- Can expose more functionality without permanently crowding the composer action row.

### Risks

- Some sites assume a fixed composer/footer height.
- Message-list sizing may be calculated in JavaScript rather than pure CSS.
- A larger footer can alter scroll anchoring or hide the newest message unless the adapter updates the appropriate bottom spacer.
- Mobile keyboards and browser toolbars may trigger repeated host relayouts.

### Acceptance requirement

Red advances only when expansion:

- Increases host layout height rather than covering content.
- Keeps the composer visible and usable.
- Keeps the latest message reachable.
- Preserves scroll anchoring within an acceptable tolerance.
- Collapses cleanly without leaving stale padding or height.
- Survives SPA navigation and composer replacement without duplication.

## Recommended architecture

Use one stateful Ghost shell with three possible structural portals:

```text
Ghost state and action authority
             │
             ├── teal: header action cell
             ├── blue: composer action cell
             └── red: composer sibling row
```

The portals are mounting locations, not separate control systems. They invoke the same Play/Pause, menu, state, and accessibility handlers.

Recommended mobile combination:

- Blue provides immediate Play/Pause and `+` access in the composer action row.
- Red is the expanded menu row opened from blue.
- Teal is an alternate or supplemental header entry when the platform has a safe header action slot.
- The current rail remains a compatibility fallback only when no structural mount contract passes verification.

## Controlled site-layout hijack rules

1. Adapter-specific structural discovery is required.
2. Ghost adds its own child or sibling; it does not replace host controls.
3. Host DOM nodes are never cloned to fake native controls.
4. Any host style adjustment must be minimal, reversible, and recorded.
5. One `data-gitl-mount` identity prevents duplicates.
6. A scoped MutationObserver repairs only the selected mount container.
7. A ResizeObserver verifies the new row or cell participates in layout.
8. If structural verification fails, remove the attempted mount and use the existing compatibility UI.
9. Never fall back to an unverified overlay that covers the composer or Send controls.
10. All placements use the existing Ghost transport authority; no second Send or Play path is created.

## Required research

Researcher / architect:

- Map the real logical rows and columns for each supported platform and responsive breakpoint.
- Identify the stable header action row, composer action row, and footer stack.
- Determine whether each layout uses Flexbox, Grid, block stacking, or JavaScript-calculated sizing.
- Define reversible insertion and removal contracts.
- Determine how each site updates message-list bottom spacing when footer height changes.

Builder:

- Build a structural mount registry behind an experimental feature flag.
- Implement one platform and one mount mode first.
- Use a custom element plus Shadow DOM for Ghost internals while keeping the host element in flow.
- Reuse one Ghost state store and existing actions.

Test engineer / Red Team:

- Add fixtures for host controls inserted before and after Ghost.
- Replace the composer subtree repeatedly and verify exactly one mount.
- Verify Send node identity and click behavior are unchanged.
- Verify red expansion pushes content instead of covering it.
- Verify unmount restores all host styles and layout.

Mobile / performance specialist:

- Test keyboard open/close, orientation, browser toolbar movement, large text, reduced motion, and narrow widths.
- Measure observer callbacks, layout shifts, ResizeObserver activity, and reattachment time.
- Test lower-end mobile hardware or equivalent throttled conditions.

Devil's Advocate:

- Challenge every host style mutation.
- Reject a mount that works only by covering content or replacing host controls.
- Reject a universal selector strategy when platform adapters are required.
- Compare maintenance cost against the usability improvement over the current rail.

## Acceptance hypothesis

The site-affixed shell should advance only if it demonstrates:

- Better one-handed access than the current rail.
- Real host-page reflow for blue and red.
- Zero Send interference.
- No duplicate UI after host rerenders or route changes.
- Reversible insertion and clean unmount.
- Stable keyboard and narrow-screen behavior.
- Acceptable lower-end-device overhead.

Until those conditions are tested, this file remains a design and research brief rather than a release commitment.
