"use strict";
/// <reference path="../csgo.d.ts" />
var PhotoViewerContextMenu;
(function (PhotoViewerContextMenu) {
    function Init() {
        const elPanel = $.GetContextPanel();
        const strSrc = elPanel.GetAttributeString('src', '');
        const elImage = elPanel.FindChildTraverse('id-photo-viewer-image');
        if (strSrc === '' || !elImage) {
            return;
        }
        elImage.SetImageFromFile(strSrc);
        const strPath = elPanel.GetAttributeString('path', '');
        const strPathID = elPanel.GetAttributeString('pathid', '');
        const bFile = strPath !== '' && strPathID !== '';
        // The folder the photo sits in, which is what the second button opens - so everything beside
        // the file's own name. A path with nothing to strip leaves the pathID's own root.
        const nSlash = strPath.lastIndexOf('/');
        const strFolder = (nSlash < 0) ? '' : strPath.substring(0, nSlash);
        const elCopyBtn = elPanel.FindChildInLayoutFile('photo-viewer-copy');
        elCopyBtn.visible = bFile;
        elCopyBtn.SetPanelEvent('onmouseover', () => { UiToolkitAPI.ShowTextTooltip('photo-viewer-copy', '#pet_photo_viewer_copy'); });
        elCopyBtn.SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideTextTooltip(); });
        elCopyBtn.SetPanelEvent('onactivate', () => {
            $.Msg('photo-viewer TEMP copy pressed: path="' + strPath + '" pathid="' + strPathID + '"\n');
            SteamOverlayAPI.CopyImageFileToClipboard(strPath, strPathID);
        });
        const elOpenBtn = elPanel.FindChildInLayoutFile('photo-viewer-open');
        elOpenBtn.visible = bFile;
        elOpenBtn.SetPanelEvent('onmouseover', () => { UiToolkitAPI.ShowTextTooltip('photo-viewer-open', '#pet_photo_viewer_folder'); });
        elOpenBtn.SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideTextTooltip(); });
        elOpenBtn.SetPanelEvent('onactivate', () => {
            $.Msg('photo-viewer TEMP open pressed: folder="' + strFolder + '" pathid="' + strPathID + '"\n');
            GameInterfaceAPI.OsOpenFileOrFolder(strFolder, strPathID);
        });
        $.Msg('photo-viewer TEMP Init: src="' + strSrc + '"\n');
        $.Msg('photo-viewer TEMP Init: path="' + strPath + '" pathid="' + strPathID + '" bFile=' + bFile + '\n');
        $.Msg('photo-viewer TEMP Init: folder="' + strFolder + '"\n');
        $.Msg('photo-viewer TEMP Init: matches=' + GameInterfaceAPI.FindFiles(strPath, strPathID).length + '\n');
    }
    PhotoViewerContextMenu.Init = Init;
})(PhotoViewerContextMenu || (PhotoViewerContextMenu = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGV4dF9tZW51X3Bob3RvX3ZpZXdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2NvbnRleHRfbWVudXMvY29udGV4dF9tZW51X3Bob3RvX3ZpZXdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUNBQXFDO0FBRXJDLElBQVUsc0JBQXNCLENBK0MvQjtBQS9DRCxXQUFVLHNCQUFzQjtJQUUvQixTQUFnQixJQUFJO1FBRW5CLE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUNwQyxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsa0JBQWtCLENBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBRSxDQUFDO1FBQ3ZELE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBRSx1QkFBdUIsQ0FBYSxDQUFDO1FBRWhGLElBQUksTUFBTSxLQUFLLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFDN0I7WUFDQyxPQUFPO1NBQ1A7UUFFRCxPQUFPLENBQUMsZ0JBQWdCLENBQUUsTUFBTSxDQUFFLENBQUM7UUFFbkMsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLGtCQUFrQixDQUFFLE1BQU0sRUFBRSxFQUFFLENBQUUsQ0FBQztRQUN6RCxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsa0JBQWtCLENBQUUsUUFBUSxFQUFFLEVBQUUsQ0FBRSxDQUFDO1FBQzdELE1BQU0sS0FBSyxHQUFHLE9BQU8sS0FBSyxFQUFFLElBQUksU0FBUyxLQUFLLEVBQUUsQ0FBQztRQUVqRCw2RkFBNkY7UUFDN0Ysa0ZBQWtGO1FBQ2xGLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUUsR0FBRyxDQUFFLENBQUM7UUFDMUMsTUFBTSxTQUFTLEdBQUcsQ0FBRSxNQUFNLEdBQUcsQ0FBQyxDQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBRSxDQUFDLEVBQUUsTUFBTSxDQUFFLENBQUM7UUFFdkUsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLHFCQUFxQixDQUFFLG1CQUFtQixDQUFFLENBQUM7UUFDdkUsU0FBUyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7UUFDMUIsU0FBUyxDQUFDLGFBQWEsQ0FBRSxhQUFhLEVBQUUsR0FBRSxFQUFFLEdBQUUsWUFBWSxDQUFDLGVBQWUsQ0FBRSxtQkFBbUIsRUFBRSx3QkFBd0IsQ0FBRSxDQUFBLENBQUEsQ0FBQyxDQUFDLENBQUM7UUFDOUgsU0FBUyxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRSxFQUFFLEdBQUUsWUFBWSxDQUFDLGVBQWUsRUFBRSxDQUFBLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDL0UsU0FBUyxDQUFDLGFBQWEsQ0FBRSxZQUFZLEVBQUUsR0FBRSxFQUFFO1lBQzFDLENBQUMsQ0FBQyxHQUFHLENBQUUsd0NBQXdDLEdBQUcsT0FBTyxHQUFHLFlBQVksR0FBRyxTQUFTLEdBQUcsS0FBSyxDQUFFLENBQUM7WUFDL0YsZUFBZSxDQUFDLHdCQUF3QixDQUFFLE9BQU8sRUFBRSxTQUFTLENBQUUsQ0FBQTtRQUMvRCxDQUFDLENBQUMsQ0FBQztRQUVILE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBRSxtQkFBbUIsQ0FBRSxDQUFDO1FBQ3ZFLFNBQVMsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBQzFCLFNBQVMsQ0FBQyxhQUFhLENBQUUsYUFBYSxFQUFFLEdBQUUsRUFBRSxHQUFFLFlBQVksQ0FBQyxlQUFlLENBQUUsbUJBQW1CLEVBQUUsMEJBQTBCLENBQUUsQ0FBQSxDQUFBLENBQUMsQ0FBQyxDQUFDO1FBQ2hJLFNBQVMsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLEdBQUUsRUFBRSxHQUFFLFlBQVksQ0FBQyxlQUFlLEVBQUUsQ0FBQSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQy9FLFNBQVMsQ0FBQyxhQUFhLENBQUUsWUFBWSxFQUFFLEdBQUUsRUFBRTtZQUMxQyxDQUFDLENBQUMsR0FBRyxDQUFFLDBDQUEwQyxHQUFHLFNBQVMsR0FBRyxZQUFZLEdBQUcsU0FBUyxHQUFHLEtBQUssQ0FBRSxDQUFDO1lBQ25HLGdCQUFnQixDQUFDLGtCQUFrQixDQUFFLFNBQVMsRUFBRSxTQUFTLENBQUUsQ0FBQztRQUM3RCxDQUFDLENBQUMsQ0FBQztRQUVILENBQUMsQ0FBQyxHQUFHLENBQUUsK0JBQStCLEdBQUcsTUFBTSxHQUFHLEtBQUssQ0FBRSxDQUFDO1FBQzFELENBQUMsQ0FBQyxHQUFHLENBQUUsZ0NBQWdDLEdBQUcsT0FBTyxHQUFHLFlBQVksR0FBRyxTQUFTLEdBQUcsVUFBVSxHQUFHLEtBQUssR0FBRyxJQUFJLENBQUUsQ0FBQztRQUMzRyxDQUFDLENBQUMsR0FBRyxDQUFFLGtDQUFrQyxHQUFHLFNBQVMsR0FBRyxLQUFLLENBQUUsQ0FBQztRQUNoRSxDQUFDLENBQUMsR0FBRyxDQUFFLGtDQUFrQyxHQUFHLGdCQUFnQixDQUFDLFNBQVMsQ0FBRSxPQUFPLEVBQUUsU0FBUyxDQUFFLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBRSxDQUFDO0lBQzlHLENBQUM7SUE1Q2UsMkJBQUksT0E0Q25CLENBQUE7QUFDRixDQUFDLEVBL0NTLHNCQUFzQixLQUF0QixzQkFBc0IsUUErQy9CIn0=