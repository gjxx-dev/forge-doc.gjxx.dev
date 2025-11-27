# 事件

Forge 使用事件总线（event bus），允许模组拦截来自原版与其他模组的各种行为事件。

示例：可以使用事件在玩家对原版木棍执行右键操作时触发某个行为。

主要用于大多数事件的主事件总线位于 `MinecraftForge#EVENT_BUS`。另外还有一个用于模组特定事件的事件总线，可通过 `FMLJavaModLoadingContext#getModEventBus` 获取，仅在特定场景下使用。下文会提供更多关于该总线的信息。

每个事件都会在这些总线之一上被触发：大多数事件在主 Forge 事件总线上触发，但有些事件会在模组专属的事件总线上触发。

事件处理器是已注册到某个事件总线上的方法。

创建事件处理器
-------------------------

事件处理器方法有且只有一个参数，并且不返回值。方法可以是静态的或实例方法，取决于实现方式。

事件处理器可以通过 `IEventBus#addListener` 直接注册，或者对于泛型事件（通过继承 `GenericEvent<T>` 标记）使用 `IEventBus#addGenericListener` 注册。任一添加监听器的方法都接受一个代表方法引用的 consumer。泛型事件处理器需要额外指定泛型的类。事件处理器应在主模组类的构造函数中注册。

```java
// 在主模组类 ExampleMod 中

// 这是模组总线（mod bus）上的事件
private void modEventHandler(RegisterEvent event) {
	// 在这里处理
}

// 这是 forge 总线（forge bus）上的事件
private static void forgeEventHandler(AttachCapabilitiesEvent<Entity> event) {
	// ...
}

// 在模组构造函数中注册
modEventBus.addListener(this::modEventHandler);
forgeEventBus.addGenericListener(Entity.class, ExampleMod::forgeEventHandler);
```

### 实例注解的事件处理器

下面的事件处理器监听 `EntityItemPickupEvent`：当实体拾取物品时，该事件会被投递到事件总线。

```java
public class MyForgeEventHandler {
	@SubscribeEvent
	public void pickupItem(EntityItemPickupEvent event) {
		System.out.println("Item picked up!");
	}
}
```

要注册此事件处理器，使用 `MinecraftForge.EVENT_BUS.register(...)` 并传入包含该处理方法的类的实例。如果想把该处理器注册到模组专属事件总线，应使用 `FMLJavaModLoadingContext.get().getModEventBus().register(...)`。

### 静态注解的事件处理器

事件处理器也可以是静态的，处理方法仍然使用 `@SubscribeEvent` 注解。与实例方法不同的是，静态处理器需要将 `Class` 本身传入进行注册，例如：

```java
public class MyStaticForgeEventHandler {
	@SubscribeEvent
	public static void arrowNocked(ArrowNockEvent event) {
		System.out.println("Arrow nocked!");
	}
}
```

必须像这样注册：`MinecraftForge.EVENT_BUS.register(MyStaticForgeEventHandler.class)`。

### 自动注册静态事件处理器

一个类可以使用 `@Mod$EventBusSubscriber` 注解。被注解的类会在对应的 `@Mod` 类被构造时自动注册到 `MinecraftForge#EVENT_BUS`。这在效果上等同于在 `@Mod` 类的构造函数末尾添加 `MinecraftForge.EVENT_BUS.register(AnnotatedClass.class);`。

你可以将想要监听的总线作为参数传入 `@Mod$EventBusSubscriber` 注解。建议同时指定模组 id（modid），因为注解处理可能无法自动推断出模组 id；同时指定要注册的总线也能提醒你确保注册的是正确的总线。你还可以指定 `Dist`（分发/物理侧）来限定该事件订阅器在哪些侧加载，这样可以避免在专用服务器上加载仅客户端使用的订阅器。

下面示例为一个只在客户端调用的静态事件监听器，监听 `RenderLevelStageEvent`：

```java
@Mod.EventBusSubscriber(modid = "mymod", bus = Bus.FORGE, value = Dist.CLIENT)
public class MyStaticClientOnlyEventHandler {
	@SubscribeEvent
	public static void drawLast(RenderLevelStageEvent event) {
		System.out.println("Drawing!");
	}
}
```

!!! note
    这不会注册类的实例；它会注册类本身（因此事件处理方法必须为静态方法）。

取消事件（Canceling）
---------

如果一个事件可被取消，它会使用 `@Cancelable` 注解标记，同时 `Event#isCancelable()` 会返回 `true`。可以通过调用 `Event#setCanceled(boolean canceled)` 修改可取消事件的取消状态：传入 `true` 表示取消该事件，传入 `false` 表示“取消取消”。但如果事件不可取消（即 `Event#isCancelable()` 为 `false`），无论传入什么布尔值，都会抛出 `UnsupportedOperationException`，因为不可取消事件的取消状态被视为不可变。

!!! important
    并非所有事件都可取消！尝试取消一个不可取消的事件将导致抛出未经检查的 `UnsupportedOperationException`，这通常会导致游戏崩溃。务必在尝试取消前使用 `Event#isCancelable()` 检查事件是否可取消。

结果（Results）
-------

有些事件包含 `Event$Result`。结果可以是三种之一：`DENY`（阻止事件）、`DEFAULT`（使用原版行为）和 `ALLOW`（强制执行该操作，即使原本不会执行）。可以通过在事件上调用 `#setResult` 并传入 `Event$Result` 来设置事件结果。并非所有事件都有结果；具有结果的事件会用 `@HasResult` 注解标记。

!!! important
    不同事件对结果的使用方式可能不同，请在使用前查看该事件的 JavaDoc。

优先级（Priority）
--------

带有 `@SubscribeEvent` 注解的事件处理方法有优先级。可以在注解中设置 `priority` 值来指定优先级。优先级取自 `EventPriority` 枚举（`HIGHEST`, `HIGH`, `NORMAL`, `LOW`, `LOWEST`, `MONITOR`）。具有 `HIGHEST` 优先级的处理器最先执行，依次向下直到 `MONITOR`，`MONITOR` 优先级在最后执行。

`MONITOR` 是一个特殊优先级：它在 `LOWEST` 之后运行，但不应影响事件结果。在 `MONITOR` 阶段尝试取消或修改事件对象可能会导致异常。`MONITOR` 常用于日志记录或其他只读操作，这些操作需要在事件最终状态确定后执行。

子事件（Sub Events）
----------

许多事件有多个变体（例如基于共同父类的 `PlayerEvent`），或有多个阶段（例如 `PotionBrewEvent`）。注意：如果你监听父事件类，那么你的方法会接收到所有子类的事件调用。

模组事件总线（Mod Event Bus）
-------------

模组事件总线主要用于监听模组生命周期事件，模组应在这些事件中进行初始化。模组总线上的每个事件都必须实现 `IModBusEvent`。许多此类事件会并行触发，以便模组可以同时被初始化。这意味着在这些事件中不能直接运行来自其他模组的代码；若需要与其他模组通信，请使用 `InterModComms` 系统。

下面是模组初始化期间在模组事件总线上最常使用的四个生命周期事件：

* `FMLCommonSetupEvent`
* `FMLClientSetupEvent` & `FMLDedicatedServerSetupEvent`
* `InterModEnqueueEvent`
* `InterModProcessEvent`

!!! note
    `FMLClientSetupEvent` 与 `FMLDedicatedServerSetupEvent` 仅在各自对应的分发侧被调用。

这四个生命周期事件都属于 `ParallelDispatchEvent` 的子类，因此会并行运行。如果你想在任一 `ParallelDispatchEvent` 中在主线程执行代码，可以使用 `#enqueueWork`。

除了生命周期事件外，模组事件总线上还有一些零散的事件用于注册、设置或初始化各种内容。这些事件大多不会并行运行，与生命周期事件不同。示例包括：

* `RegisterColorHandlersEvent`
* `ModelEvent$BakingCompleted`
* `TextureStitchEvent`
* `RegisterEvent`

一个简单的经验法则：当事件应在模组初始化期间处理时，该事件通常会在模组事件总线上触发。

