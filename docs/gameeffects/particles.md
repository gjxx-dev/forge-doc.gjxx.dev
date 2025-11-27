# 粒子

粒子是游戏中的一种效果，用于美化体验、提升沉浸感。由于粒子的创建和引用方式，它们既有用处也需要谨慎使用。

创建粒子
-------------------

粒子的实现分为[**仅客户端**][sides]用于显示粒子，以及通用实现用于引用粒子或从服务器同步数据。

| 类               |   侧   | 描述                                                                     |
| :--------------- | :----: | :----------------------------------------------------------------------- |
| ParticleType     |  BOTH  | 粒子类型定义的注册对象，用于在任一侧引用粒子                             |
| ParticleOptions  |  BOTH  | 一个数据容器，用于在网络或命令中向相关客户端同步信息                     |
| ParticleProvider | CLIENT | 由 `ParticleType` 注册的工厂，用来根据 `ParticleOptions` 构造 `Particle` |
| Particle         | CLIENT | 在相关客户端上可渲染的粒子逻辑                                           |

### ParticleType

`ParticleType` 是定义特定粒子类型的注册对象，并在双方提供可引用的标识。因此，每个 `ParticleType` 都必须被[注册][registration]。

每个 `ParticleType` 接受两个参数：`overrideLimiter`（决定粒子是否无视距离始终渲染）和一个 `ParticleOptions$Deserializer`（用于在客户端读取传入的 `ParticleOptions`）。由于基类 `ParticleType` 是抽象的，需要实现一个方法：`#codec`。该方法表示如何对该类型的 `ParticleOptions` 进行编码与解码。

!!! note
    `ParticleType#codec` 仅在生物群系（biome）的编解码器中被用于原版实现。

在多数情况下，不需要向客户端发送任何粒子数据。对于这些情形，更简单的做法是创建 `SimpleParticleType` 的实例：它实现了 `ParticleType` 和 `ParticleOptions`，并且不会向客户端发送除了类型以外的自定义数据。大多数原版实现使用 `SimpleParticleType`，红石粉用于着色、与方块/物品相关的粒子除外。

!!! important
    如果粒子只在客户端被引用，则不需要 `ParticleType` 即可使其生成。然而，要使用 `ParticleEngine` 中的预建逻辑或从服务器生成粒子，则必须有 `ParticleType`。

### ParticleOptions

`ParticleOptions` 表示每个粒子所携带的数据。它也用于在服务器生成粒子时发送数据。所有生成粒子的方法都接受一个 `ParticleOptions`，以便知道粒子的类型以及生成所需的数据。

`ParticleOptions` 可分为三种方法：

| 方法           | 描述                                         |
| :------------- | :------------------------------------------- |
| getType        | 获取粒子的类型定义，即 `ParticleType`        |
| writeToNetwork | 在服务器上将粒子数据写入缓冲区以发送到客户端 |
| writeToString  | 将粒子数据写为字符串                         |

这些对象要么按需动态构造，要么作为 `SimpleParticleType` 的单例存在。

#### ParticleOptions$Deserializer

为了在客户端接收 `ParticleOptions`，或在命令中引用数据，必须通过 `ParticleOptions$Deserializer` 对粒子数据进行反序列化。`ParticleOptions$Deserializer` 中的每个方法在 `ParticleOptions` 中都有对应的编码方法：

| 方法        | ParticleOptions 编码器 | 描述                                   |
| :---------- | :--------------------: | :------------------------------------- |
| fromCommand |     writeToString      | 从字符串（通常来自命令）解码粒子数据。 |
| fromNetwork |     writeToNetwork     | 在客户端从缓冲区解码粒子数据。         |

当需要发送自定义粒子数据时，该对象会传入 `ParticleType` 的构造函数。

### Particle

`Particle` 提供了在屏幕上绘制粒子所需的渲染逻辑。创建任何 `Particle` 都需要实现两个方法：

| 方法          | 描述                 |
| :------------ | :------------------- |
| render        | 将粒子渲染到屏幕上。 |
| getRenderType | 获取粒子的渲染类型。 |

一个常见的 `Particle` 子类用于渲染纹理是 `TextureSheetParticle`。虽然需要实现 `#getRenderType`，但只要设置了纹理精灵，粒子就会在其位置被渲染。

#### ParticleRenderType

`ParticleRenderType` 是 `RenderType` 的一种变体，用来为该类型的每个粒子构建启动与清理阶段，然后通过 `Tesselator` 一次性渲染它们。粒子可以属于六种不同的渲染类型。

| 渲染类型                   | 描述                                                                                |
| :------------------------- | :---------------------------------------------------------------------------------- |
| TERRAIN_SHEET              | 渲染位于方块可用纹理集合中的粒子。                                                  |
| PARTICLE_SHEET_OPAQUE      | 渲染位于粒子集合中且为不透明的粒子纹理。                                            |
| PARTICLE_SHEET_TRANSLUCENT | 渲染位于粒子集合中且为半透明的粒子纹理。                                            |
| PARTICLE_SHEET_LIT         | 与 `PARTICLE_SHEET_OPAQUE` 相同，但不使用粒子着色器。                               |
| CUSTOM                     | 提供混合和深度掩码的设置，但不包含渲染实现；渲染逻辑应在 `Particle#render` 中实现。 |
| NO_RENDER                  | 粒子永远不会被渲染。                                                                |

实现自定义渲染类型将留作练习。

### ParticleProvider

最后，粒子通常通过 `ParticleProvider` 创建。工厂有一个单一方法 `#createParticle`，用于根据粒子数据、客户端关卡、位置和运动增量创建粒子。由于 `Particle` 并不依赖于特定的 `ParticleType`，可以在不同工厂间重复使用同一 `Particle` 实现。

`ParticleProvider` 必须通过在**mod 事件总线**上订阅 `RegisterParticleProvidersEvent` 来注册。在事件内部，可以通过 `#registerSpecial` 方法注册工厂的实例。

!!! important
    `RegisterParticleProvidersEvent` 只能在客户端调用，因此应在某个隔离的客户端类中进行分发（sided off），通过 `DistExecutor` 或 `@EventBusSubscriber` 引用。

#### ParticleDescription、SpriteSet 与 SpriteParticleRegistration

有三种粒子渲染类型不能使用上述注册方法：`PARTICLE_SHEET_OPAQUE`、`PARTICLE_SHEET_TRANSLUCENT` 和 `PARTICLE_SHEET_LIT`。这是因为这三种渲染类型使用的精灵集由 `ParticleEngine` 直接加载。因此，提供的纹理必须通过不同的方法获取并注册。假定你的粒子为 `TextureSheetParticle` 的子类型，这是该逻辑在原版中的唯一实现方式。

要为粒子添加纹理，必须在 `assets/<modid>/particles` 中添加一个新的 JSON 文件，这称为 `ParticleDescription`。该文件的名称将代表要附加工厂的 `ParticleType` 的注册名。每个粒子 JSON 是一个对象，对象中包含一个键 `textures`，它保存一个 `ResourceLocation` 数组。任何 `<modid>:<path>` 格式的纹理将在 `assets/<modid>/textures/particle/<path>.png` 被引用。

```js
{
  "textures": [
    // 将指向位于
    // assets/mymod/textures/particle/particle_texture.png 的纹理
    "mymod:particle_texture",
    // 纹理应按绘制顺序排列
    // 例如 particle_texture 会先渲染，然后在一段时间后渲染 particle_texture2
    "mymod:particle_texture2"
  ]
}
```

要引用粒子纹理，`TextureSheetParticle` 的子类型应该接收一个 `SpriteSet` 或从 `SpriteSet` 获取的 `TextureAtlasSprite`。`SpriteSet` 保存了由 `ParticleDescription` 定义的精灵列表。`SpriteSet` 有两个方法，两者都会以不同方式获取 `TextureAtlasSprite`。第一个方法接受两个整数，底层实现允许精灵随粒子年龄变化而改变纹理；第二个方法接收一个 `Random` 实例以从精灵集中随机选取纹理。可以使用 `TextureSheetParticle` 的辅助方法从 `SpriteSet` 设置精灵：`#pickSprite`（使用随机方法选取纹理）和 `#setSpriteFromAge`（使用两个整数的百分比方法选取纹理）。

要注册这些粒子纹理，需要在 `RegisterParticleProvidersEvent#registerSpriteSet` 方法中提供一个 `SpriteParticleRegistration`。此方法接收包含相关精灵集的 `SpriteSet` 并创建一个 `ParticleProvider` 来生成粒子。最简单的实现方法是，让某个类实现 `ParticleProvider` 并让构造函数接收 `SpriteSet`，然后正常将 `SpriteSet` 传递给粒子。

!!! note
    如果你注册的 `TextureSheetParticle` 子类型只包含一个纹理，那么可以向 `#registerSprite` 方法提供一个 `ParticleProvider$Sprite`，其函数接口与 `ParticleProvider` 本质上相同。

生成粒子
-------------------

粒子可以从任一关卡实例生成。然而，每一侧都有特定的生成方式。如果在 `ClientLevel` 上，可以调用 `#addParticle` 来生成粒子，或者调用 `#addAlwaysVisibleParticle` 来生成一个可从任意距离看到的粒子。如果在 `ServerLevel` 上，可以调用 `#sendParticles` 来发送一个数据包给客户端以生成粒子。在服务器上调用客户端的两个方法将不会有任何效果。

[sides]: ../concepts/sides.md
[registration]: ../concepts/registries.md#methods-for-registering

