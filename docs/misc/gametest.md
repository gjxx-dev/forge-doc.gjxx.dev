# 游戏测试

游戏测试（Game Tests）是一种在游戏内运行单元测试的方式。该系统设计为可扩展且支持并行运行，以便高效地执行大量不同的测试。测试对象的交互与行为验证只是该框架众多应用场景中的一部分。

创建游戏测试
----------------

一个标准的游戏测试遵循三个基本步骤：

1. 加载一个结构或模板，该模板包含要测试的场景初始状态。
1. 一个方法对场景执行逻辑操作。
1. 方法逻辑执行；如果达到成功状态则测试通过，否则测试失败，结果会存储在场景旁边的讲台（lectern）上。

因此，要创建游戏测试，必须有一个包含初始场景状态的模板，以及一个提供执行逻辑的方法。

### 测试方法

游戏测试方法是 `Consumer<GameTestHelper>` 类型的引用，意味着它接收一个 `GameTestHelper` 并不返回值。要让游戏测试方法被识别，它必须带有 `@GameTest` 注解：

```java
public class ExampleGameTests {
  @GameTest
  public static void exampleTest(GameTestHelper helper) {
    // 执行测试逻辑
  }
}
```

`@GameTest` 注解还包含若干成员，用于配置该测试如何运行。

```java
// 在某个类中
@GameTest(
  setupTicks = 20L, // 测试在执行前会花费 20 个 tick 进行设置
  required = false // 若失败则仅记录，不影响批次执行
)
public static void exampleConfiguredTest(GameTestHelper helper) {
  // 执行测试逻辑
}
```

#### 相对定位

所有 `GameTestHelper` 方法会将结构模板场景内的相对坐标转换为结构方块当前位点的绝对坐标。为方便在相对与绝对定位之间互转，可使用 `GameTestHelper#absolutePos` 和 `GameTestHelper#relativePos`。

可以通过在游戏内加载结构（使用[test 命令][test]），将玩家放置到目标位置，然后运行 `/test pos` 命令，来获得结构模板的相对位置。该命令会将玩家相对于最近结构（200 方块内）的坐标导出为聊天中的可复制文本组件，可直接作为局部 final 变量使用。

!!! tip
    可以在 `/test pos` 命令末尾添加变量名来指定导出局部变量的名称：

    ```bash
    /test pos <var> # 导出 'final BlockPos <var> = new BlockPos(...);'
    ```

#### 成功完成

游戏测试方法的职责只有一件：在有效完成时标记测试为成功。如果在超时（由 `GameTest#timeoutTicks` 定义）前没有达到成功状态，则测试自动失败。

`GameTestHelper` 中有许多用于定义成功状态的抽象方法；其中四个方法尤其重要：

|         方法         | 描述                                                                                                             |
| :------------------: | :--------------------------------------------------------------------------------------------------------------- |
|      `#succeed`      | 将测试标记为成功。                                                                                               |
|     `#succeedIf`     | 立即运行提供的 `Runnable`，如果没有抛出 `GameTestAssertException` 则标记成功；若在当前 tick 未成功则视为失败。   |
|    `#succeedWhen`    | 在每个 tick 上运行提供的 `Runnable` 直到超时，只要在某次 tick 没有抛出 `GameTestAssertException` 即标记成功。    |
| `#succeedOnTickWhen` | 在指定 tick 运行提供的 `Runnable`，若未抛出 `GameTestAssertException` 则标记成功；若在其他 tick 成功则视为失败。 |

!!! important
    游戏测试会每个 tick 执行直到测试被标记为成功。因此，若在指定 tick 标记成功的逻辑，必须确保在之前的所有 tick 中都能导致失败。

#### 调度动作

并非所有动作都会在测试开始时立即发生。可以将动作安排在特定时间或间隔执行：

|       方法       | 描述                                      |
| :--------------: | :---------------------------------------- |
| `#runAtTickTime` | 在指定的 tick 运行该动作。                |
| `#runAfterDelay` | 在当前 tick 之后的 x 个 tick 运行该动作。 |
|  `#onEachTick`   | 在每个 tick 都运行该动作。                |

#### 断言

在游戏测试期间任何时刻都可以进行断言以检查某个条件是否成立。`GameTestHelper` 提供许多断言方法；通常通过在不满足条件时抛出 `GameTestAssertException` 来表示断言失败。

### 生成的测试方法

如果需要动态生成测试方法，可以创建一个测试方法生成器（test method generator）。这些方法不带参数，返回一个 `TestFunction` 的集合。测试方法生成器需带有 `@GameTestGenerator` 注解：

```java
public class ExampleGameTests {
  @GameTestGenerator
  public static Collection<TestFunction> exampleTests() {
    // 返回 TestFunction 的集合
  }
}
```

#### TestFunction

`TestFunction` 是由 `@GameTest` 注解以及执行该测试的方法所封装的信息对象。

!!! tip
    任何带 `@GameTest` 注解的方法都会通过 `GameTestRegistry#turnMethodIntoTestFunction` 转换为 `TestFunction`。可以参考该方法来在不使用注解的情况下创建 `TestFunction`。

### 批处理（Batching）

游戏测试可以按批次执行，而不是按注册顺序执行。若多个测试使用相同的 `GameTest#batch` 字符串，则会被分为同一批次。

单独来看，批处理本身并无多大作用；但可用于在测试运行的当前关卡上执行统一的设置与清理。可通过使用 `@BeforeBatch`（用于设置）或 `@AfterBatch`（用于清理）来注解相应方法。`#batch` 方法的字符串必须与测试中指定的批次名一致。

批处理方法为 `Consumer<ServerLevel>` 类型，接收一个 `ServerLevel` 并无返回值：

```java
public class ExampleGameTests {
  @BeforeBatch(batch = "firstBatch")
  public static void beforeTest(ServerLevel level) {
    // 执行设置
  }

  @GameTest(batch = "firstBatch")
  public static void exampleTest2(GameTestHelper helper) {
    // 测试逻辑
  }
}
```

注册游戏测试
----------------

游戏测试必须注册后才能在游戏内运行。有两种注册方式：使用 `@GameTestHolder` 注解或监听 `RegisterGameTestsEvent`。两种方式都要求测试方法使用 `@GameTest`、`@GameTestGenerator`、`@BeforeBatch` 或 `@AfterBatch` 注解。

### GameTestHolder

`@GameTestHolder` 注解会注册该类型（类、接口、枚举或 record）内的所有测试方法。`@GameTestHolder` 接收一个参数，其用法多样。在此，提供的 `#value` 必须为模组 ID，否则默认配置下测试不会运行。

```java
@GameTestHolder(MODID)
public class ExampleGameTests {
  // ...
}
```

### RegisterGameTestsEvent

也可以通过 `RegisterGameTestsEvent` 使用 `#register` 注册类或方法。事件监听器必须添加到模组事件总线（mod event bus）。通过该方式注册的方法需要在每个 `@GameTest` 注解的方法上提供 `GameTest#templateNamespace` 的模组 ID。

```java
// 在某个类中
public void registerTests(RegisterGameTestsEvent event) {
  event.register(ExampleGameTests.class);
}

// 在 ExampleGameTests
@GameTest(templateNamespace = MODID)
public static void exampleTest3(GameTestHelper helper) {
  // 执行设置
}
```

!!! note
    `GameTestHolder#value` 与 `GameTest#templateNamespace` 的值可以与当前模组 ID 不同。如果要这么做，需要在 [构建脚本配置][namespaces] 中进行相应修改。

结构模板
-----------

游戏测试在由结构（template）加载的场景中进行。所有模板定义了场景的尺寸以及要加载的初始数据（方块和实体）。模板必须以 `.nbt` 文件存放于 `data/<namespace>/structures` 中。

!!! tip
    可以使用结构方块创建并保存结构模板。

模板的位置由以下因素决定：

* 是否指定了模板的命名空间（namespace）。
* 是否需要在名称前添加类名。
* 是否指定了模板名称。

模板的命名空间由 `GameTest#templateNamespace` 决定；如果未指定，则使用 `GameTestHolder#value`；如果仍未指定，则使用 `minecraft`。

如果在带注解的类或方法上应用了 `@PrefixGameTestTemplate(false)`，则不会在模板名称前添加简单类名；否则，会将类名转为小写并在模板名前加上该类名及一个点。

模板名称由 `GameTest#template` 决定；若未指定，则使用方法名的小写形式。

```java
// 所有结构的模组 id 为 MODID
@GameTestHolder(MODID)
public class ExampleGameTests {

  // 类名前缀被添加，模板名未指定
  // 模板位置： 'modid:examplegametests.exampletest'
  @GameTest
  public static void exampleTest(GameTestHelper helper) { /*...*/ }

  // 禁用类名前缀，模板名未指定
  // 模板位置： 'modid:exampletest2'
  @PrefixGameTestTemplate(false)
  @GameTest
  public static void exampleTest2(GameTestHelper helper) { /*...*/ }

  // 类名前缀被添加，模板名已指定
  // 模板位置： 'modid:examplegametests.test_template'
  @GameTest(template = "test_template")
  public static void exampleTest3(GameTestHelper helper) { /*...*/ }

  // 禁用类名前缀，模板名已指定
  // 模板位置： 'modid:test_template2'
  @PrefixGameTestTemplate(false)
  @GameTest(template = "test_template2")
  public static void exampleTest4(GameTestHelper helper) { /*...*/ }
}
```

运行游戏测试
----------------

可以使用 `/test` 命令运行游戏测试。`test` 命令高度可配置，但与运行测试相关的子命令主要有：

|   子命令    | 描述                                |
| :---------: | :---------------------------------- |
|    `run`    | 运行指定的测试：`run <test_name>`。 |
|  `runall`   | 运行所有可用测试。                  |
|  `runthis`  | 运行玩家 15 格范围内最近的测试。    |
| `runthese`  | 运行玩家 200 格范围内的测试。       |
| `runfailed` | 运行上一次运行中失败的所有测试。    |

!!! note
    子命令跟在 `/test` 后使用：`/test <subcommand>`。

构建脚本配置
----------------

游戏测试在构建脚本（`build.gradle`）中提供了一些额外配置，以便在不同设置下运行并进行集成。

### 启用其他命名空间

如果构建脚本按照推荐方式[配置][buildscript]，则默认只启用当前模组 ID 下的游戏测试。若要启用其它命名空间（namespace）加载游戏测试，需要在运行配置中设置属性 `forge.enabledGameTestNamespaces`，其值为用逗号分隔的命名空间列表。若该属性为空或未设置，则将加载所有命名空间。

```gradle
// 在某个运行配置中
property 'forge.enabledGameTestNamespaces', 'modid1,modid2,modid3'
```

!!! warning
    命名空间之间不得包含空格，否则命名空间将无法正确加载。

### Game Test 服务器运行配置

Game Test 服务器是一种特殊配置，会运行一个构建服务器。该构建服务器返回值为所需的、失败的游戏测试数量（exit code）。所有失败的测试（无论是必需的还是可选的）都会被记录。可以使用 `gradlew runGameTestServer` 启动该服务器。

### 在其它运行配置中启用游戏测试

默认情况下，仅 `client`、`server` 和 `gameTestServer` 运行配置启用了游戏测试。如果需要在其它运行配置中启用游戏测试，请在运行配置中设置 `forge.enableGameTest` 属性为 `true`。

```gradle
// 在某个运行配置中
property 'forge.enableGameTest', 'true'
```

[test]: #running-game-tests
[namespaces]: #enabling-other-namespaces
[event]: ../concepts/events.md#creating-an-event-handler
[buildscript]: ../gettingstarted/gettingstarted.md#simple-buildgradle-customizations

