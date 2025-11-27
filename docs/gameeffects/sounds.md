# 声音（Sounds）

术语
----

| 术语                       | 含义                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------ |
| Sound Events（声音事件）   | 触发音效的事件，例如 `minecraft:block.anvil.hit` 或 `botania:spreader_fire`。        |
| Sound Category（音量类别） | 声音所属的类别，例如 `player`、`block` 或 `master`。声音设置界面的滑块对应这些类别。 |
| Sound File（音频文件）     | 磁盘上的实际文件（.ogg）。                                                           |

`sounds.json`
---------------

该 JSON 文件定义声音事件、它们播放的音频文件、字幕等。声音事件由 [`ResourceLocation`][loc] 标识。`sounds.json` 应位于资源命名空间根目录下（`assets/<namespace>/sounds.json`），并定义该命名空间内的声音事件。

完整规范见原版 [wiki]，下面示例强调了关键部分：

```js
{
  "open_chest": {
    "subtitle": "mymod.subtitle.open_chest",
    "sounds": [ "mymod:open_chest_sound_file" ]
  },
  "epic_music": {
    "sounds": [
      {
        "name": "mymod:music/epic_music",
        "stream": true
      }
    ]
  }
}
```

在顶层对象下，每个键对应一个声音事件。注意命名空间不在键内指定，而是由 JSON 所在命名空间决定。每个事件可以指定一个用于字幕的本地化键（当字幕开启时显示）。实际播放的音频文件通过 `sounds` 数组指定；若数组中有多个音频，游戏会在触发事件时随机选择其一播放。

示例中展示了两种指定音频文件的方式。通常较长的音频（背景音乐或唱片）应使用第二种形式并设置 `stream: true`，这样 Minecraft 会从磁盘流式读取而不是全部载入内存；第二种方式还可以指定音量（volume）、音高（pitch）和权重（weight）。

对于命名空间 `namespace` 与路径 `path`，对应的音频文件路径为 `assets/<namespace>/sounds/<path>.ogg`。因此 `mymod:open_chest_sound_file` 指向 `assets/mymod/sounds/open_chest_sound_file.ogg`，而 `mymod:music/epic_music` 指向 `assets/mymod/sounds/music/epic_music.ogg`。

`sounds.json` 也可以通过 [数据生成][datagen] 生成。

创建声音事件
---------------

要在服务端引用声音，需创建一个对应 `sounds.json` 条目的 `SoundEvent` 并将其[注册][registration]。通常，创建 `SoundEvent` 时使用的位置应设置为其注册名。

`SoundEvent` 用作对声音的引用并在需要时传递。如果模组提供了 API，应在 API 中公开这些 `SoundEvent`。

!!! note
    只要声音在 `sounds.json` 中注册，即使没有对应的 `SoundEvent`，在逻辑客户端依然可以引用该声音。

播放声音
--------

原版包含多种播放声音的方法，使用场景有所不同。下文用“Server Behavior / Client Behavior”区分逻辑侧的行为（参见 [sides]）。

`Level` 方法：

1. `playSound(Player, BlockPos, SoundEvent, SoundSource, volume, pitch)`
   - 转发到重载方法并在每个坐标上加 0.5。
2. `playSound(Player, double x, double y, double z, SoundEvent, SoundSource, volume, pitch)`
   - 客户端行为：若传入玩家为当前客户端玩家，则在客户端播放声音。
   - 服务端行为：向附近所有玩家播放该声音，但**不包含**传入的玩家（参数可为 `null`）。
   - 用法：适用于在客户端与服务端同时运行的代码中调用，客户端负责给触发玩家播放，而服务端负责通知其它玩家。
3. `playLocalSound(double x, double y, double z, SoundEvent, SoundSource, volume, pitch, distanceDelay)`
   - 客户端行为：仅在客户端世界播放，可选基于距离延迟（`distanceDelay`）。
   - 服务端行为：不执行任何操作。
   - 用法：仅在客户端使用，适合通过自定义数据包触发或其它客户端特效（如雷声）。

`ClientLevel` 方法：

1. `playLocalSound(BlockPos, SoundEvent, SoundSource, volume, pitch, distanceDelay)`
   - 转发到 `Level` 的 `playLocalSound` 重载并在每个坐标上加 0.5。

`Entity` 方法：

1. `playSound(SoundEvent, volume, pitch)`
   - 转发到 `Level` 的相应重载，传入 `null` 玩家。
   - 客户端行为：无效果。
   - 服务端行为：在该实体所在位置向所有玩家播放声音。

`Player` 方法：

1. `playSound(SoundEvent, volume, pitch)`（覆盖自 `Entity`）
   - 转发到 `Level` 的相应重载，传入 `this` 作为玩家。
   - 客户端行为：无效果（见 `LocalPlayer` 的覆盖）。
   - 服务端行为：向附近所有玩家播放声音但不包含该玩家。

`LocalPlayer` 方法：

1. `playSound(SoundEvent, volume, pitch)`（覆盖自 `Player`）
   - 转发到 `Level` 的相应重载，传入 `this` 作为玩家。
   - 客户端行为：在客户端播放声音。
   - 服务端行为：该方法仅在客户端存在。

[loc]: ../concepts/resources.md#resourcelocation
[wiki]: https://minecraft.wiki/w/Sounds.json
[datagen]: ../datagen/client/sounds.md
[registration]: ../concepts/registries.md#methods-for-registering
[sides]: ../concepts/sides.md
