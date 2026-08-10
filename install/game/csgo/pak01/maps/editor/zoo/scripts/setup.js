import { CSDamageFlags, CSDamageTypes, Instance } from "cs_script/point_script";

Instance.ServerCommand("sv_cheats 1");
Instance.ServerCommand("mp_warmup_offline_enabled 1");
Instance.ServerCommand("mp_warmup_pausetimer 1");

let bFirstActivate = true;
Instance.OnPlayerActivate(({ player }) => {
    if (bFirstActivate) {
        bFirstActivate = false;
        player.JoinTeam(2);
        Instance.ServerCommand("bot_stop 1");
        Instance.ServerCommand("bot_add");
    }
});

Instance.OnModifyPlayerDamage(({ player }) => {
    if (player.GetOriginalPlayerController().IsBot()) {
        return { damageFlags: CSDamageFlags.PREVENT_DEATH };
    }
});

Instance.OnPlayerDamage((event) => {
    if (event.damageTypes == CSDamageTypes.SLASH) {
        Instance.QueueAfterThinks(() => {
            const velocity = event.player.GetAbsVelocity();
            velocity.z += 500;
            event.player.Teleport({ velocity });
        });
    }
});
