"use strict";
/// <reference path="../csgo.d.ts" />
var AddMajorTokensAnim;
(function (AddMajorTokensAnim) {
    function SetTransitionEndEvent(elPanel) {
        if (!elPanel.Data().PropertyTransitionEndHandler) {
            function fnOnPropertyTransitionEndEventNotifications(panel, propertyName) {
                if (elPanel === panel && propertyName === 'opacity') {
                    if (elPanel.visible === true && elPanel.BIsTransparent()) {
                        elPanel.visible = false;
                        return true;
                    }
                }
                return false;
            }
            elPanel.Data().PropertyTransitionEndHandler = $.RegisterEventHandler('PropertyTransitionEnd', elPanel, fnOnPropertyTransitionEndEventNotifications);
        }
    }
    AddMajorTokensAnim.SetTransitionEndEvent = SetTransitionEndEvent;
    function StartAnim(elPanel, elBalance, nCredits, CallAtEndAnimation) {
        elPanel.TriggerClass('add_major_tokens__amount-anim');
        elPanel.SetHasClass('hide-particles', false);
        elPanel.SetDialogVariableInt('credits', nCredits);
        $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.XP.NewSkillGroup', 'MOUSE');
        let elCredits = elPanel.FindChildInLayoutFile('id-major-store-add-tokens-credits');
        if (!elCredits) {
            elCredits = $.CreatePanel('Panel', elPanel, 'id-major-store-add-tokens-credits');
            elCredits.BLoadLayoutSnippet('credits-text');
        }
        $.Schedule(1.5, () => {
            const balancePos = elBalance.GetPositionWithinWindow();
            const notificationPos = elPanel.GetPositionWithinWindow();
            const newXPos = Math.floor(balancePos.x / elPanel.actualuiscale_x - notificationPos.x / elPanel.actualuiscale_x) - Math.floor((elPanel.actuallayoutwidth / elPanel.actualuiscale_x) / 2.0);
            const newYPos = Math.floor(balancePos.y / elPanel.actualuiscale_y - notificationPos.y / elPanel.actualuiscale_y) - Math.floor((elPanel.actuallayoutheight / elPanel.actualuiscale_y) / 2.05);
            elCredits.SetPositionInPixels(newXPos, newYPos, 0);
            elCredits.style.preTransformScale2d = '.4;';
            elPanel.SetHasClass('hide-particles', true);
            $.Schedule(1, () => {
                CallAtEndAnimation();
                $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.gift_claim', 'MOUSE');
                elCredits.DeleteAsync(0);
            });
        });
    }
    AddMajorTokensAnim.StartAnim = StartAnim;
})(AddMajorTokensAnim || (AddMajorTokensAnim = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWRkX21ham9yX3Rva2Vuc19hbmltLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvY29tbW9uL2FkZF9tYWpvcl90b2tlbnNfYW5pbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQ0EscUNBQXFDO0FBRXJDLElBQVUsa0JBQWtCLENBNEQzQjtBQTVERCxXQUFVLGtCQUFrQjtJQUV4QixTQUFnQixxQkFBcUIsQ0FBRSxPQUFlO1FBR2xELElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsNEJBQTRCLEVBQ2hEO1lBRUksU0FBUywyQ0FBMkMsQ0FBRyxLQUFjLEVBQUUsWUFBb0I7Z0JBRXZGLElBQUssT0FBTyxLQUFLLEtBQUssSUFBSSxZQUFZLEtBQUssU0FBUyxFQUNwRDtvQkFFSSxJQUFLLE9BQU8sQ0FBQyxPQUFPLEtBQUssSUFBSSxJQUFJLE9BQU8sQ0FBQyxjQUFjLEVBQUUsRUFDekQ7d0JBRUksT0FBTyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7d0JBQ3hCLE9BQU8sSUFBSSxDQUFDO3FCQUNmO2lCQUNKO2dCQUNELE9BQU8sS0FBSyxDQUFDO1lBQ2pCLENBQUM7WUFFRCxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUMsNEJBQTRCLEdBQUcsQ0FBQyxDQUFDLG9CQUFvQixDQUFFLHVCQUF1QixFQUFFLE9BQU8sRUFBRSwyQ0FBMkMsQ0FBRSxDQUFDO1NBQ3pKO0lBRUwsQ0FBQztJQXhCZSx3Q0FBcUIsd0JBd0JwQyxDQUFBO0lBRUQsU0FBZ0IsU0FBUyxDQUFFLE9BQWUsRUFBRSxTQUFpQixFQUFFLFFBQWUsRUFBRSxrQkFBNkI7UUFFekcsT0FBTyxDQUFDLFlBQVksQ0FBRSwrQkFBK0IsQ0FBRSxDQUFDO1FBQ3hELE9BQU8sQ0FBQyxXQUFXLENBQUUsZ0JBQWdCLEVBQUUsS0FBSyxDQUFFLENBQUM7UUFDL0MsT0FBTyxDQUFDLG9CQUFvQixDQUFFLFNBQVMsRUFBRSxRQUFRLENBQUUsQ0FBQztRQUVwRCxDQUFDLENBQUMsYUFBYSxDQUFFLHFCQUFxQixFQUFFLDZCQUE2QixFQUFFLE9BQU8sQ0FBRSxDQUFDO1FBQ2pGLElBQUksU0FBUyxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBRSxtQ0FBbUMsQ0FBRSxDQUFDO1FBQ3JGLElBQUssQ0FBQyxTQUFTLEVBQ2Y7WUFDSSxTQUFTLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLG1DQUFtQyxDQUFFLENBQUM7WUFDbkYsU0FBUyxDQUFDLGtCQUFrQixDQUFFLGNBQWMsQ0FBRSxDQUFDO1NBQ2xEO1FBRUQsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxHQUFHLEVBQUUsR0FBRSxFQUFFO1lBQ2pCLE1BQU0sVUFBVSxHQUFHLFNBQVMsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1lBRXZELE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1lBQzFELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUUsVUFBVSxDQUFDLENBQUMsR0FBQyxPQUFPLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQyxDQUFDLEdBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsaUJBQWlCLEdBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxHQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3JMLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUUsVUFBVSxDQUFDLENBQUMsR0FBQyxPQUFPLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQyxDQUFDLEdBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEdBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQyxHQUFDLElBQUksQ0FBQyxDQUFDO1lBRXZMLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBRSxDQUFDO1lBQ3JELFNBQVMsQ0FBQyxLQUFLLENBQUMsbUJBQW1CLEdBQUcsS0FBSyxDQUFDO1lBQzVDLE9BQU8sQ0FBQyxXQUFXLENBQUUsZ0JBQWdCLEVBQUUsSUFBSSxDQUFFLENBQUM7WUFDOUMsQ0FBQyxDQUFDLFFBQVEsQ0FBRSxDQUFDLEVBQUUsR0FBRSxFQUFFO2dCQUNmLGtCQUFrQixFQUFFLENBQUM7Z0JBQ3JCLENBQUMsQ0FBQyxhQUFhLENBQUUscUJBQXFCLEVBQUUsdUJBQXVCLEVBQUUsT0FBTyxDQUFFLENBQUM7Z0JBQzNFLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0IsQ0FBQyxDQUFDLENBQUE7UUFDTixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUE5QmUsNEJBQVMsWUE4QnhCLENBQUE7QUFFTCxDQUFDLEVBNURTLGtCQUFrQixLQUFsQixrQkFBa0IsUUE0RDNCIn0=