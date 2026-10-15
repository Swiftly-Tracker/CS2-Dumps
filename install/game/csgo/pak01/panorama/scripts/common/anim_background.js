"use strict";
/// <reference path="../csgo.d.ts" />
var HudSpecatorBg;
(function (HudSpecatorBg) {
    const m_elBg = $.GetContextPanel().FindChildTraverse('AnimBackground');
    function PickBg(xuid) {
        if (!m_elBg || !m_elBg.IsValid()) {
            return;
        }
        m_elBg.PopulateFromSteamID(xuid);
    }
    HudSpecatorBg.PickBg = PickBg;
})(HudSpecatorBg || (HudSpecatorBg = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5pbV9iYWNrZ3JvdW5kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvY29tbW9uL2FuaW1fYmFja2dyb3VuZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBRXJDLElBQVUsYUFBYSxDQWN0QjtBQWRELFdBQVUsYUFBYTtJQUV0QixNQUFNLE1BQU0sR0FBRyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsaUJBQWlCLENBQUUsZ0JBQWdCLENBQWtDLENBQUM7SUFFekcsU0FBZ0IsTUFBTSxDQUFHLElBQVk7UUFFcEMsSUFBSyxDQUFDLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsRUFDakM7WUFDQyxPQUFPO1NBQ1A7UUFHRCxNQUFNLENBQUMsbUJBQW1CLENBQUUsSUFBSSxDQUFFLENBQUM7SUFDcEMsQ0FBQztJQVRlLG9CQUFNLFNBU3JCLENBQUE7QUFDRixDQUFDLEVBZFMsYUFBYSxLQUFiLGFBQWEsUUFjdEIifQ==