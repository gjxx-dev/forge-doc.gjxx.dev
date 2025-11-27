# Minecraft 中的侧（Sides）
===================

在为 Minecraft 编写模组时，一个非常重要的概念是“两个侧”：*客户端（client）* 和 *服务端（server）*。很多关于侧的问题存在常见误解与错误，这些问题可能不会导致游戏崩溃，但会带来意外且常难以预测的行为。

不同类型的“侧”
------------------------

当我们说“客户端”或“服务端”时，通常会直观地理解我们指的是游戏的哪一部分：客户端是用户交互的程序，而服务端是多人游戏中供用户连接的程序。但实际上，这两个术语在不同语境中可能带有歧义。下面把 “客户端 / 服务端” 的四种含义区分开来：

* 物理客户端（Physical client） - 物理客户端是当你从启动器启动 Minecraft 时运行的完整程序。游戏在图形界面与交互存在期间所运行的线程、进程与服务都属于物理客户端。
* 物理服务器（Physical server） - 通常称为专用服务器（dedicated server），当你运行任何不带 GUI 的 `minecraft_server.jar` 时启动的完整程序就是物理服务器。
* 逻辑服务器（Logical server） - 逻辑服务器负责游戏逻辑：怪物生成、天气、物品栏更新、生命值、AI 等所有游戏机制。逻辑服务器存在于物理服务器中，但也会在物理客户端内运行（如单人世界中，逻辑服务器与逻辑客户端一并运行）。逻辑服务器始终在名为 `Server Thread` 的线程中运行。
* 逻辑客户端（Logical client） - 逻辑客户端负责接收玩家输入并将其转发到逻辑服务器，同时接收逻辑服务器的信息并以图形形式呈现给玩家。逻辑客户端在 `Render Thread` 中运行，不过通常还有其它线程处理音频、区块渲染分批等任务。

在 MinecraftForge 代码库中，物理侧使用枚举 `Dist` 表示，而逻辑侧使用枚举 `LogicalSide` 表示。

按侧执行操作
-----------------------------------

### `Level#isClientSide`

这个布尔检查是你最常用来判断逻辑侧的方法。在 `Level` 对象上查询该字段可确定该关卡属于哪个**逻辑**侧：若该字段为 `true`，说明该关卡当前运行在逻辑客户端；若为 `false`，说明该关卡运行在逻辑服务器。因此物理服务器上的该字段总是 `false`，但 `false` 并不必然意味着这是一个物理服务器，因为在物理客户端内的逻辑服务器也会使用 `false`（也就是单人世界）。

在需要判断是否运行游戏逻辑或机制时应使用此检查。例如，当你希望在玩家每次点击方块时给玩家造成伤害，或让机器把泥土处理成钻石时，应在确认 `#isClientSide` 为 `false` 后执行相关逻辑。在逻辑客户端执行游戏逻辑会导致不同步（如幽灵实体、统计不同步等），更糟时可能会导致崩溃。

除了 `DistExecutor` 外，这个检查应作为默认用法；很少需要其它方式来判断侧并调整行为。

### `DistExecutor`

考虑到客户端与服务端共享单个“通用” jar，而物理侧通过两个不同的 jar 分离，一个重要的问题出现了：如何调用仅在某个物理侧存在的代码？`net.minecraft.client` 下的所有类仅在物理客户端存在——若你在某个类中直接引用这些类名，那么当该类在不含这些类的环境（比如物理服务端）被加载时会崩溃。初学者常见错误是在方块或方块实体类中直接调用 `Minecraft.getInstance().<doStuff>()`，这会在物理服务器加载该类时造成崩溃。

为此，FML 提供了 `DistExecutor`，它能在不同的物理侧上运行不同的方法，或仅在某个物理侧运行某个方法。

!!! note
    需要注意的是，FML 是基于**物理**侧来判断的。单人世界（逻辑服务器 + 逻辑客户端均在物理客户端内）将始终被视为 `Dist.CLIENT`。

`DistExecutor` 通过接收一个供给器（supplier）来运行执行方法，借助 JVM 的 `invokedynamic` 指令延迟类加载，从而避免在不支持该类的环境中进行类加载导致的崩溃。被执行的方法应为静态方法并置于不同的类中；若无需参数，则应传入方法引用而不是一个会执行方法的 supplier。

`DistExecutor` 的两个主要方法是 `#runWhenOn` 与 `#callWhenOn`：前者在指定物理侧运行动作，后者在指定物理侧运行并返回值。它们还有 `#safe*` 与 `#unsafe*` 的变体。`#safe*` 与 `#unsafe*` 在开发环境的差异在于 `#safe*` 会校验传入的 lambda 是否为返回方法引用的形式（否则抛出错误），在生产环境中两者功能相同。

```java
// 在客户端类中：ExampleClass
public static void unsafeRunMethodExample(Object param1, Object param2) { /* ... */ }

public static Object safeCallMethodExample() { /* ... */ }

// 在一些公共类中
DistExecutor.unsafeRunWhenOn(Dist.CLIENT, () -> ExampleClass.unsafeRunMethodExample(var1, var2));

DistExecutor.safeCallWhenOn(Dist.CLIENT, () -> ExampleClass::safeCallMethodExample);
```

!!! warning
    由于 Java 9+ 中 `invokedynamic` 行为的更改，所有 `#safe*` 变体在开发环境下会将原始异常包装到一个 `BootstrapMethodError` 中。建议使用 `#unsafe*` 变体或通过检查 [`FMLEnvironment#dist`][dist] 来替代。

### 线程组（Thread Groups）

若 `Thread.currentThread().getThreadGroup() == SidedThreadGroups.SERVER` 为真，则当前线程很可能在逻辑服务器侧；否则很可能在逻辑客户端侧。该方法在无法访问 `Level` 对象检查 `isClientSide` 时用于检索**逻辑**侧。它是一个猜测（通过查看当前线程所属线程组来判断逻辑侧），因此仅当其它选项不可用时才使用。在几乎所有场景下，应优先使用 `Level#isClientSide`。

### `FMLEnvironment#dist` 与 `@OnlyIn`

`FMLEnvironment#dist` 表示代码运行所在的**物理**侧。由于该值在启动时确定，因此不依赖于猜测。然而可用场景有限。

在成员（方法或字段）上使用注解 `@OnlyIn(Dist)` 表示在非指定**物理**侧的定义中该成员会被彻底剥离（stripped out）。通常在阅读 Mojang 反编译代码时会看到这类注解，表示 Mojang 的混淆器在打包时移除了这些方法。**不要**直接在你自己的代码中使用该注解；应使用 `DistExecutor` 或检查 `FMLEnvironment#dist` 来实现按物理侧的不同行为。

常见错误
---------------

### 跨逻辑侧直接访问（Reaching Across Logical Sides）

当你要从一个逻辑侧向另一个逻辑侧发送信息时，**必须**使用网络数据包（network packets）。在单人模式下直接把逻辑服务器的数据写入逻辑客户端是非常诱人的快捷方式，但这样会带来严重后果。

单人场景中，逻辑客户端与逻辑服务器运行在同一 JVM 中，它们对静态字段的写入和读取会引发竞态条件（race conditions）及多线程相关问题。

另一个常见错误是从可能运行在逻辑服务器的通用代码中直接访问物理客户端专有类（如 `Minecraft`）。在物理客户端中调试这些错误时可能会误以为代码运行正常，但在物理服务器上它会立刻导致崩溃。

编写单侧（One-Sided）模组
----------------------

在最近的版本中，Minecraft Forge 已经在 `mods.toml` 中移除了 `sidedness` 属性，这意味着你的模组应能在物理客户端或物理服务器中任一侧加载并正常运行。对于单侧模组（例如仅服务端模组），通常会在 `DistExecutor#safeRunWhenOn` 或 `DistExecutor#unsafeRunWhenOn` 中注册事件处理器，而不是在模组构造函数中直接调用注册方法。原则上，如果模组加载在错误的一侧，应尽量不执行任何行为或监听事件。单侧模组一般不注册方块、物品等需要在另一侧也可用的元素。

此外，若你的模组为单侧，它通常不会阻止用户连接缺失该模组的服务器。因此应在 `mods.toml` 中设置 `displayTest` 属性为合适值。

```toml
[[mods]]
  # ...

  # MATCH_VERSION 会在客户端和服务端版本不匹配时显示红叉。若你有服务端与客户端元素，应使用默认或 MATCH_VERSION。
  # IGNORE_SERVER_VERSION 在服务器端存在但客户端缺失时不会显示红叉。若你是仅服务端模组，请使用此项。
  # IGNORE_ALL_VERSION 在任一侧存在时都不会显示红叉。此为特殊情形，仅当你的模组没有任何服务端组件时使用。
  # NONE 表示不设定显示测试，这需要你自己通过 IExtensionPoint.DisplayTest 实现更多自定义逻辑。
  displayTest="IGNORE_ALL_VERSION" # 若未指定，默认是 MATCH_VERSION（可选项）
```

若使用自定义显示测试，`displayTest` 应设为 `NONE`，并注册一个 `IExtensionPoint$DisplayTest` 扩展：

```java
// 确保模组在其它网络侧缺失不会导致客户端将服务器显示为不兼容
ModLoadingContext.get().registerExtensionPoint(IExtensionPoint.DisplayTest.class, () -> new IExtensionPoint.DisplayTest(() -> NetworkConstants.IGNORESERVERONLY, (a, b) -> true));
```

上例告诉客户端忽略服务器端缺失模组的版本，也告诉服务器不提示客户端该模组应当存在。该代码既适用于客户端单侧模组也适用于服务端单侧模组。

[invokedynamic]: https://docs.oracle.com/javase/specs/jvms/se17/html/jvms-6.html#jvms-6.5.invokedynamic
[dist]: #fmlenvironmentdist-and-onlyin
[structuring]: ../gettingstarted/modfiles.md#modstoml

