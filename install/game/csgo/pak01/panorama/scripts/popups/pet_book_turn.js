"use strict";
/// <reference path="../csgo.d.ts" />
//
// Pet Picture Book - the page turn. One leaf hinged on the spine carries the page that is turning,
// and the static pages either side are refilled as it goes over. Nothing here knows what is on a
// page: the host fills them, and is told when the spread changes.
//
// The cover is just the right page of the first view with the left page hidden, so the book opens
// with the same turn that flips every other page.
//
// Layout and animation are all inline style writes from here. CSS 3D animation was not reliable in
// this codebase.
//
var PetBookTurn;
(function (PetBookTurn) {
    const _m_cp = $.GetContextPanel();
    // Geometry lives here, not in the CSS, so it cannot drift from the turn math.
    const PAGE_W = 560;
    const PAGE_H = 640;
    const MARGIN = 8;
    const BOOK_W = PAGE_W * 2 + MARGIN * 2;
    const BOOK_H = PAGE_H + MARGIN * 16;
    const LEFT_X = MARGIN;
    const SPINE_X = MARGIN + PAGE_W;
    const CLOSED_SHIFT = -PAGE_W / 2; // centres the lone cover while closed
    const FLIP_MS = 650;
    const FRAME_SEC = 0.016;
    // Spreads are indexes, so nothing asked for is -1.
    const NO_PENDING = -1;
    // PAGE_SHADOW_* must stay in step with .book-page-left / .book-page-right: the leaf's shadow
    // peaks at the same values the static pages sit at, which is what makes the handoff invisible.
    const PAGE_SHADOW_DX = 4;
    const PAGE_SHADOW_A = 0.40;
    const LEAF_SHADE_MAX = 0.32;
    const BACK_SHADE_BIAS = 1.25; // incoming face reads darker than the outgoing one
    const CAST_MAX = 0.28;
    const CAST_W = 170;
    const GUTTER_MAX = 0.40;
    let _m_host;
    let _m_book;
    let _m_left;
    let _m_right;
    let _m_gutter;
    let _m_leaf;
    let _m_leafFront;
    let _m_leafBack;
    let _m_leafShade;
    let _m_leafCast;
    let _m_sides = [];
    let _m_spread = 0; // spread 0 = the closed cover view
    let _m_busy = false;
    let _m_pending = NO_PENDING; // spread a click asked for mid-flip
    let _m_mode = 'page';
    // aPages is the book in reading order, by page number. startSpread is bounded here rather than
    // trusted: it arrives as a panel attribute and _FillSide indexes _m_sides with it. Does not call
    // OnSpreadChanged - the host reads Spread() once this returns.
    function Init(host, aPages, startSpread) {
        _m_host = host;
        _m_book = _m_cp.FindChildInLayoutFile('id-pet-book');
        _m_left = _m_cp.FindChildInLayoutFile('id-book-left');
        _m_right = _m_cp.FindChildInLayoutFile('id-book-right');
        _m_gutter = _m_cp.FindChildInLayoutFile('id-book-gutter');
        _m_leaf = _m_cp.FindChildInLayoutFile('id-book-leaf');
        _m_leafFront = _m_cp.FindChildInLayoutFile('id-leaf-front');
        _m_leafBack = _m_cp.FindChildInLayoutFile('id-leaf-back');
        _m_leafShade = _m_cp.FindChildInLayoutFile('id-leaf-shade');
        _m_leafCast = _m_cp.FindChildInLayoutFile('id-leaf-cast');
        // A MARGIN of slack around the pages, because overflow:noclip did not take effect here -
        // this is what keeps the turning leaf and the shadows from being clipped.
        _m_book.style.width = BOOK_W + 'px;';
        _m_book.style.height = BOOK_H + 'px;';
        _SizePage(_m_left);
        _SizePage(_m_right);
        _SizePage(_m_leaf);
        _m_left.style.transform = 'translateX( ' + LEFT_X + 'px );';
        _m_right.style.transform = 'translateX( ' + SPINE_X + 'px );';
        // Leaf is right-aligned rather than translated, because its transform is the rotation.
        _m_leaf.style.marginRight = MARGIN + 'px;';
        _m_leaf.style.transform = 'rotateY( 0deg );';
        _m_gutter.style.height = PAGE_H + 'px;';
        _m_leafCast.style.width = CAST_W + 'px;';
        _m_leafCast.style.height = PAGE_H + 'px;';
        _HideLeaf();
        _BuildSides(aPages);
        _ShowSpread(_Bound(startSpread));
    }
    PetBookTurn.Init = Init;
    function Spread() {
        return _m_spread;
    }
    PetBookTurn.Spread = Spread;
    function NumSpreads() {
        return _m_sides.length / 2;
    }
    PetBookTurn.NumSpreads = NumSpreads;
    function _Bound(spread) {
        return Math.max(0, Math.min(spread, NumSpreads() - 1));
    }
    function _SizePage(p) {
        p.style.width = PAGE_W + 'px;';
        p.style.height = PAGE_H + 'px;';
    }
    function _Lerp(a, b, t) {
        return a + (b - a) * t;
    }
    //----------------------------------------------------------------------------------
    // The leaf: one panel hinged on the spine, carrying the page that is turning.
    //----------------------------------------------------------------------------------
    // Strength of the leaf's drop shadow, 0..1. This is the rule that stops shadows popping, and it
    // depends on what is lying flat underneath each end of the arc:
    //
    //  'page'  - a static page at both ends, each already carrying an identical shadow, so the
    //            leaf's must reach 0 at both ends. |sin(deg)|.
    //  open /  - the cover view has no left page, so at -180deg there is nothing underneath and the
    //  close     leaf carries the FULL shadow, handing it to (or taking it from) the static left
    //            page as that page is switched on/off. |sin(deg/2)| ramps 0 -> 1 across the arc.
    function _ShadowEnvelope(deg) {
        const rad = deg * Math.PI / 180;
        return _m_mode === 'page' ? Math.abs(Math.sin(rad)) : Math.abs(Math.sin(rad / 2));
    }
    function _SetLeaf(deg) {
        _m_leaf.style.transform = 'rotateY( ' + deg + 'deg );';
        _m_leaf.style.opacity = '1';
        // Which face shows swaps at -90deg, where the leaf is edge-on with zero projected width, so
        // the swap cannot be seen.
        const facingFront = deg > -90 && deg < 90;
        _m_leafFront.style.opacity = facingFront ? '1' : '0';
        _m_leafBack.style.opacity = facingFront ? '0' : '1';
        // 0 flat, 1 edge-on. Anything about the leaf's own angle rides this, so it is always 0 at the
        // moments the leaf appears or is hidden.
        const lift = Math.abs(Math.sin(deg * Math.PI / 180));
        _m_leafShade.style.opacity = (lift * LEAF_SHADE_MAX * (facingFront ? 1 : BACK_SHADE_BIAS)).toFixed(3);
        // dx stays POSITIVE for the whole turn - do not "fix" it to point left on the back half. The
        // rotation mirrors the leaf (which is why .book-leaf-back has to un-mirror its content) and it
        // mirrors this offset too: local +4 renders as screen -4 past -90deg, matching the left page's
        // own -4px shadow. Flipping the sign here inverts it twice and the shadow jumps to the spine
        // side at the handoff.
        _m_leaf.style.boxShadow = PAGE_SHADOW_DX + 'px 8px 26px 0px rgba( 0, 0, 0, '
            + (_ShadowEnvelope(deg) * PAGE_SHADOW_A).toFixed(3) + ' );';
        _SetCastShadow(deg, lift, facingFront);
    }
    // Leaves the angle where it is; each turn sets its own start angle. Moving it here would risk a
    // one-frame flash if the transform and the opacity miss the same paint.
    function _HideLeaf() {
        _m_leaf.style.opacity = '0';
        _m_leafFront.style.opacity = '0';
        _m_leafBack.style.opacity = '0';
        _m_leafShade.style.opacity = '0';
        _m_leafCast.style.opacity = '0';
        // Emptied, not just faded. The faces hold whole pages, and a page left on the leaf is a second
        // panel carrying the same data-page and data-slot as the one on screen - see _SlotPanel in
        // pet_book_pages.ts, which then has two to choose from and no way to tell which one anybody
        // can see.
        _m_leafFront.RemoveAndDeleteChildren();
        _m_leafBack.RemoveAndDeleteChildren();
        _m_leaf.style.boxShadow = PAGE_SHADOW_DX + 'px 8px 26px 0px rgba( 0, 0, 0, 0 );';
    }
    // Contact shadow the lifted leaf throws on the page below, parked against the leaf's projected
    // edge so it reads as the gap between them.
    function _SetCastShadow(deg, lift, overRight) {
        // Over the left half of an open or close there is no page to catch it.
        const pageBelow = overRight || _m_mode === 'page';
        if (!pageBelow || lift <= 0) {
            _m_leafCast.style.opacity = '0';
            return;
        }
        const projW = PAGE_W * Math.abs(Math.cos(deg * Math.PI / 180));
        const x = overRight ? SPINE_X + projW : SPINE_X - projW - CAST_W;
        // Mirrored on the left half so the gradient keeps darkening toward the leaf.
        _m_leafCast.style.transform = 'translateX( ' + x.toFixed(0) + 'px )'
            + (overRight ? ';' : ' scale3d( -1, 1, 1 );');
        _m_leafCast.style.opacity = (lift * CAST_MAX).toFixed(3);
    }
    function _ApplySpreadState() {
        const closed = _m_spread === 0;
        _m_book.style.transform = 'translateX( ' + (closed ? CLOSED_SHIFT : 0) + 'px );';
        _m_left.style.opacity = closed ? '0' : '1';
        _m_gutter.style.opacity = closed ? '0' : GUTTER_MAX.toFixed(3);
    }
    //----------------------------------------------------------------------------------
    // Content: which side carries what, and filling a side.
    //----------------------------------------------------------------------------------
    function _BuildSides(aPages) {
        _m_sides = [];
        _m_sides.push({ kind: 'blank' });
        _m_sides.push({ kind: 'cover' });
        // In reading order, and their numbers are not their positions: the book leaves pages out.
        aPages.forEach(nPage => _m_sides.push({ kind: 'page', num: nPage }));
        // The odd page out goes BEFORE the back cover, not after it, so the back always lands on the
        // right of the last spread however many pages there are. Nothing about the sections has to be
        // arranged around this - they are ordered for what is on them, and this absorbs the parity.
        if (_m_sides.length % 2 === 0) {
            _m_sides.push({ kind: 'blank' });
        }
        _m_sides.push({ kind: 'back' });
    }
    // Searched, not computed: a page number is not its position once the book leaves pages out.
    // Side 0 is the hidden left of the cover view, and a spread is two sides. 0 for a page that is
    // not in the book.
    function SpreadOfPage(nPage) {
        const index = _m_sides.findIndex(side => side.kind === 'page' && side.num === nPage);
        return index < 0 ? 0 : Math.floor(index / 2);
    }
    PetBookTurn.SpreadOfPage = SpreadOfPage;
    function _FillSide(container, index) {
        container.RemoveAndDeleteChildren();
        const side = _m_sides[index];
        if (!side || side.kind === 'blank') {
            return;
        }
        // Fresh panel per fill: loading a snippet into a panel that already loaded one does not
        // replace the old content.
        const inner = $.CreatePanel('Panel', container, '', { class: 'pb-page-inner' });
        if (side.kind === 'cover') {
            inner.BLoadLayoutSnippet('page-cover');
        }
        else if (side.kind === 'back') {
            inner.BLoadLayoutSnippet('page-back');
        }
        else {
            // What is on a page is the host's. This file only decides which page goes where and how
            // it turns.
            _m_host.FillPage(inner, side.num || 0);
        }
    }
    // Re-reads the spread on screen from the page model. Refuses mid-turn: the leaf is carrying page
    // panels then, and rebuilding them underneath it would tear the animation.
    function RefreshSpread() {
        if (_m_busy) {
            return;
        }
        _ShowSpread(_m_spread);
    }
    PetBookTurn.RefreshSpread = RefreshSpread;
    function _ShowSpread(spread) {
        _m_spread = spread;
        _FillSide(_m_left, spread * 2);
        _FillSide(_m_right, spread * 2 + 1);
        _ApplySpreadState();
    }
    //----------------------------------------------------------------------------------
    // Page turning
    //----------------------------------------------------------------------------------
    // Front-loaded: brisk off the spine, then a long settle. Sub-1 exponent shifts progress earlier
    // without moving the endpoints.
    function _Ease(t) {
        const s = t * t * (3 - 2 * t);
        return Math.pow(s, 0.72);
    }
    function _Tween(onFrame, onDone) {
        const start = Date.now();
        const tick = () => {
            const t = (Date.now() - start) / FLIP_MS; // wall clock, so flips are frame-rate independent
            if (t >= 1) {
                onFrame(1);
                onDone();
                return;
            }
            onFrame(_Ease(t));
            $.Schedule(FRAME_SEC, tick);
        };
        tick();
    }
    function _RunTurn(leafFrom, leafTo, onDone) {
        const opening = _m_mode === 'open';
        const closing = _m_mode === 'close';
        const bookFrom = opening ? CLOSED_SHIFT : 0;
        const bookTo = closing ? CLOSED_SHIFT : 0;
        _Tween((e) => {
            _SetLeaf(_Lerp(leafFrom, leafTo, e));
            if (bookFrom !== bookTo) {
                _m_book.style.transform = 'translateX( ' + _Lerp(bookFrom, bookTo, e).toFixed(0) + 'px );';
            }
            // Gutter travels with the turn instead of snapping on after the page lands.
            if (opening) {
                _m_gutter.style.opacity = (e * GUTTER_MAX).toFixed(3);
            }
            else if (closing) {
                _m_gutter.style.opacity = ((1 - e) * GUTTER_MAX).toFixed(3);
            }
        }, onDone);
    }
    // One turn, however far it goes. The leaf carries the side you leave on its front and the side
    // you arrive on its back, so a jump across chapters costs the same single flip as a step - the
    // spreads passed over are never seen, because they are under the leaf.
    function TurnTo(target) {
        _m_host.OnBeforeTurn();
        // Bounded here so every caller can ask for whatever it likes, dead arrows included.
        const to = _Bound(target);
        if (to === _m_spread) {
            return;
        }
        // Remember where a click that lands mid-flip wanted to go, rather than dropping it.
        if (_m_busy) {
            _m_pending = to;
            return;
        }
        _m_busy = true;
        const from = _m_spread;
        const forward = to > from;
        // Only the two ends of the book have a turn of their own, so a jump between chapters is a plain
        // page turn however far it reaches.
        _m_mode = to === 0 ? 'close' : from === 0 ? 'open' : 'page';
        if (forward) {
            _FillSide(_m_right, to * 2 + 1);
            _FillSide(_m_leafFront, from * 2 + 1);
            _FillSide(_m_leafBack, to * 2);
            _SetLeaf(0);
        }
        else {
            // Closing switches the left page off at once: the leaf arrives lying exactly over it with the
            // same content and the same full shadow, so the swap is invisible. What belongs under the leaf
            // from here is the empty cover view.
            if (_m_mode === 'close') {
                _m_left.style.opacity = '0';
            }
            else {
                _FillSide(_m_left, to * 2);
            }
            _FillSide(_m_leafBack, from * 2);
            _FillSide(_m_leafFront, to * 2 + 1);
            _SetLeaf(-180);
        }
        _m_spread = to;
        _PlayTurnSound(forward);
        _m_host.OnSpreadChanged(to);
        _RunTurn(forward ? 0 : -180, forward ? -180 : 0, () => {
            // The side the leaf was lying over, filled once it is out of the way.
            if (forward) {
                _FillSide(_m_left, to * 2);
            }
            else {
                _FillSide(_m_right, to * 2 + 1);
            }
            _FinishTurn();
        });
    }
    PetBookTurn.TurnTo = TurnTo;
    // Let the settled page paint a frame before hiding the leaf.
    function _FinishTurn() {
        $.Schedule(FRAME_SEC, () => {
            _HideLeaf();
            _ApplySpreadState();
            _m_busy = false;
            const pending = _m_pending;
            _m_pending = NO_PENDING;
            if (pending !== NO_PENDING) {
                TurnTo(pending);
            }
        });
    }
    // One sound per turn, picked by what the turn is - the cover lifting and dropping are the book
    // opening and closing, everything between is a page.
    function _PlayTurnSound(forward) {
        const strSound = _m_mode === 'open' ? 'UI.BookOpen'
            : _m_mode === 'close' ? 'UI.BookClose'
                : forward ? 'UI.BookPageFwd' : 'UI.BookPageBwd';
        $.DispatchEvent('CSGOPlaySoundEffect', strSound, 'MOUSE');
    }
})(PetBookTurn || (PetBookTurn = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGV0X2Jvb2tfdHVybi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BvcHVwcy9wZXRfYm9va190dXJuLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFDckMsRUFBRTtBQUNGLG1HQUFtRztBQUNuRyxpR0FBaUc7QUFDakcsa0VBQWtFO0FBQ2xFLEVBQUU7QUFDRixrR0FBa0c7QUFDbEcsa0RBQWtEO0FBQ2xELEVBQUU7QUFDRixtR0FBbUc7QUFDbkcsaUJBQWlCO0FBQ2pCLEVBQUU7QUFDRixJQUFVLFdBQVcsQ0FpZXBCO0FBamVELFdBQVUsV0FBVztJQUVwQixNQUFNLEtBQUssR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7SUFFbEMsOEVBQThFO0lBQzlFLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQztJQUNuQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUM7SUFDbkIsTUFBTSxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBQ2pCLE1BQU0sTUFBTSxHQUFHLE1BQU0sR0FBRyxDQUFDLEdBQUcsTUFBTSxHQUFHLENBQUMsQ0FBQztJQUN2QyxNQUFNLE1BQU0sR0FBRyxNQUFNLEdBQUcsTUFBTSxHQUFHLEVBQUUsQ0FBQztJQUNwQyxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUM7SUFDdEIsTUFBTSxPQUFPLEdBQUcsTUFBTSxHQUFHLE1BQU0sQ0FBQztJQUNoQyxNQUFNLFlBQVksR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBRyxzQ0FBc0M7SUFFMUUsTUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDO0lBQ3BCLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQztJQUV4QixtREFBbUQ7SUFDbkQsTUFBTSxVQUFVLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFdEIsNkZBQTZGO0lBQzdGLCtGQUErRjtJQUMvRixNQUFNLGNBQWMsR0FBRyxDQUFD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