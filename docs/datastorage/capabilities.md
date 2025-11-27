# 能力系统（The Capability System）

能力（Capabilities）提供了一种动态且灵活的方式来暴露功能，而无需直接实现大量接口。

概念上，每个 capability 以接口的形式提供一项功能。

Forge 为 `BlockEntities`、`Entities`、`ItemStacks`、`Levels` 和 `LevelChunks` 添加了能力支持，这些能力可以通过事件附加或在相应对象的自定义实现中覆盖能力方法来暴露。下面章节将详细说明。

Forge 提供的能力
-----------------

Forge 提供了三种常见能力：`IItemHandler`、`IFluidHandler` 和 `IEnergyStorage`。

`IItemHandler`：用于处理物品槽的接口。可用于方块实体（如箱子、机器）、实体（额外的玩家槽位、怪物的背包）或物品栈（便携背包等）。它取代了旧的 `Container` 与 `WorldlyContainer`，更适合自动化场景。

`IFluidHandler`：用于处理流体存储的接口，同样可应用于方块实体、实体或物品栈。

`IEnergyStorage`：用于处理能量容器的接口，可应用于方块实体、实体或物品栈，基于 TeamCoFH 的 RedstoneFlux API。

使用已有能力
----------------

如前所述，方块实体（BlockEntities）、实体（Entities）和物品栈（ItemStacks）通过 `ICapabilityProvider` 接口实现能力提供者特性。该接口增加了 `#getCapability` 方法，用于查询关联提供者对象上存在的能力。

要获取能力，需要通过其唯一实例引用。例如 `IItemHandler` 的能力实例通常保存在 `ForgeCapabilities#ITEM_HANDLER`，也可以通过 `CapabilityManager#get` 获取：

```java
public static final Capability<IItemHandler> ITEM_HANDLER = CapabilityManager.get(new CapabilityToken<>(){});
```

`CapabilityManager#get` 会返回与你类型相关的非空 capability 引用。匿名 `CapabilityToken` 允许 Forge 在保留弱依赖的同时拥有必要的泛型信息以获取正确的 capability。

!!! important
    即便某能力实例非空，也不代表该能力已经可用或已注册。可以通过 `Capability#isRegistered` 进行检查。

`#getCapability` 方法具有第二个参数 `Direction`，可用于请求某个面的特定实例；若传入 `null`，则表明请求来自方块内部或侧无意义的上下文（例如不同维度），此时会请求一个不关心面的通用实例。`#getCapability` 的返回类型通常为能力声明类型的 `LazyOptional`（例如 `LazyOptional<IItemHandler>`）。若该提供者不支持请求的能力，将返回空的 `LazyOptional`。

暴露能力
---------

要暴露能力，首先需要能力类型的实例。注意每个拥有该能力的对象应有独立的实例，因为能力通常与容器对象绑定。

以 `IItemHandler` 为例，默认实现为 `ItemStackHandler`，其构造器可选参数用于指定槽位数量。但不要依赖默认实现的存在，能力系统的目的之一是避免在能力不存在时发生加载错误，因此在实例化时应先检查能力是否已注册（参见前文 `CapabilityManager#get` 的说明）。

在拥有能力实例后，应通过重写 `#getCapability` 通知系统你暴露了该能力，并返回该接口引用的 `LazyOptional`。可在方法中比较传入的 capability 实例与要暴露的 capability；若你的机器根据查询面返回不同槽位，可使用 `side` 参数判断。对于实体与物品栈，可忽略该参数，但依然可以将其作为上下文（例如玩家的 `Direction#UP` 可对应头盔槽）。别忘了在不处理时回退到 `super`，否则已有附加能力会停止工作。

能力必须在提供者生命周期结束时通过 `LazyOptional#invalidate` 进行失效处理。对于属于某对象（owned）的 `BlockEntities` 与 `Entities`，可在 `#invalidateCaps` 中使 `LazyOptional` 失效；对于非属主的提供者，应在 `AttachCapabilitiesEvent#addListener` 中传入用于失效的 runnable。

```java
// 在某个 BlockEntity 子类中
LazyOptional<IItemHandler> inventoryHandlerLazyOptional;

// 传入实例的 supplier（如 () -> inventoryHandler ）
inventoryHandlerLazyOptional = LazyOptional.of(inventoryHandlerSupplier);

@Override
public <T> LazyOptional<T> getCapability(Capability<T> cap, Direction side) {
  if (cap == ForgeCapabilities.ITEM_HANDLER) {
    return inventoryHandlerLazyOptional.cast();
  }
  return super.getCapability(cap, side);
}

@Override
public void invalidateCaps() {
  super.invalidateCaps();
  inventoryHandlerLazyOptional.invalidate();
}
```

!!! tip
    若某对象仅暴露单一能力，可使用 `Capability#orEmpty` 简化判断。

`Item` 是特殊情况，因为其能力提供者存储在 `ItemStack` 上。应通过 `Item#initCapabilities` 附加 provider 来持有该栈的能力生命周期。

建议在代码中直接测试能力可用性，而非依赖映射或其它数据结构，因为能力检查可能会在每个刻（tick）被大量对象执行，需尽量保证性能。

附加能力
--------

如前所述，可通过 `AttachCapabilitiesEvent` 将能力附加到现有提供者、`Level` 或 `LevelChunk`。该事件适用于所有能提供能力的对象，提供五种有效的泛型类型：

* `AttachCapabilitiesEvent<Entity>`：仅针对实体触发。
* `AttachCapabilitiesEvent<BlockEntity>`：仅针对方块实体触发。
* `AttachCapabilitiesEvent<ItemStack>`：仅针对物品栈触发。
* `AttachCapabilitiesEvent<Level>`：仅针对等级触发。
* `AttachCapabilitiesEvent<LevelChunk>`：仅针对区块（level chunk）触发。

泛型类型不能更具体。例如：若要为 `Player` 附加能力，需订阅 `AttachCapabilitiesEvent<Entity>` 并在回调中判断提供对象是否为 `Player`，再附加能力。

事件对象提供 `#addCapability` 方法用于将能力提供者附加到目标对象。添加的是能力提供者（capability providers），而非能力本身；提供者可根据不同面返回能力。若能力需持久化存储，可实现 `ICapabilitySerializable<T extends Tag>`，在提供能力的同时实现标签的保存/加载。

关于如何实现 `ICapabilityProvider`，请参阅上文 “暴露能力（Exposing a Capability）” 节。

创建自定义能力
----------------

能力可通过两种方式注册：`RegisterCapabilitiesEvent` 或 `@AutoRegisterCapability`。

### RegisterCapabilitiesEvent

通过在模组事件总线上处理 `RegisterCapabilitiesEvent` 并调用 `#register` 注册能力类型类：

```java
@SubscribeEvent
public void registerCaps(RegisterCapabilitiesEvent event) {
  event.register(IExampleCapability.class);
}
```

### @AutoRegisterCapability

通过在能力类型上添加注解 `@AutoRegisterCapability` 来注册能力：

```java
@AutoRegisterCapability
public interface IExampleCapability {
  // ...
}
```

持久化 LevelChunk 与 BlockEntity 的能力
-----------------------------------

与 Levels、Entities、ItemStacks 不同，LevelChunks 与 BlockEntities 仅在标记为脏（dirty）时写入磁盘。如果能力在 LevelChunk 或 BlockEntity 上具有持久化状态，应确保在状态更改时将其宿主标记为脏。

例如 `ItemStackHandler`（常用于方块实体的物品栏）提供了可重写的 `void onContentsChanged(int slot)` 方法，用于在内容变化时标记 BlockEntity 为脏。

```java
public class MyBlockEntity extends BlockEntity {

  private final IItemHandler inventory = new ItemStackHandler(...) {
    @Override
    protected void onContentsChanged(int slot) {
      super.onContentsChanged(slot);
      setChanged();
    }
  };

  // ...
}
```

与客户端同步数据
------------------

默认情况下，能力数据不会自动发送给客户端。如需同步，模组需自行通过数据包实现同步逻辑。

常见需要同步的场景（均为可选）：

1. 实体生成或方块放置时，向客户端共享初始化值。
2. 存储数据变化时，通知部分或全部观察该对象的客户端。
3. 新客户端开始查看该实体或方块时，发送已有数据。

实现网络数据包的详细信息见 [Networking][network] 页面。

玩家死亡时的数据持久化
----------------------

默认情况下，能力数据在玩家死亡时不保留。如需保留，需要在玩家实体克隆（重生）过程中手动复制数据。

可在 `PlayerEvent$Clone` 中读取原实体的数据并赋值给新实体。通过 `#isWasDeath` 可区分是死后重生还是从末地返回；后者会已存在数据，因此应避免重复复制。

[expose]: #exposing-a-capability
[handled]: ../concepts/events.md#creating-an-event-handler
[network]: ../networking/index.md
