# 注册系统（Registries）
==========

注册是将模组的对象（例如物品、方块、音效等）告知游戏的过程。注册很重要：若不注册，游戏不会识别这些对象，可能导致异常行为或崩溃。

游戏中大多数需要注册的对象由 Forge 的注册表（registries）处理。注册表类似于一个映射（map），将值分配给键。Forge 使用带有 [`ResourceLocation`][ResourceLocation] 键的注册表来注册对象，这使得 `ResourceLocation` 可作为对象的“注册名（registry name）”。

每种可注册对象类型都有自己的注册表。要查看 Forge 封装的所有注册表，请查看 `ForgeRegistries` 类。一个注册表内的所有注册名必须唯一，但不同注册表之间的名字不会冲突。例如，存在 `Block` 注册表和 `Item` 注册表；同名 `example:thing` 可以同时作为一个方块和一个物品存在而不冲突；但若在同一注册表中使用相同名字注册两个不同对象，第二个对象会覆盖第一个。

注册方法
------------------

有两种正确的注册方式：使用 `DeferredRegister` 类，或使用生命周期事件 `RegisterEvent`。

### DeferredRegister

`DeferredRegister` 是推荐的注册方式。它允许使用静态初始化器的便利，同时避免相关问题。它简单地维护一组条目供应器（suppliers），并在 `RegisterEvent` 期间通过这些供应器注册对象。

示例：模组注册自定义方块：

```java
private static final DeferredRegister<Block> BLOCKS = DeferredRegister.create(ForgeRegistries.BLOCKS, MODID);

public static final RegistryObject<Block> ROCK_BLOCK = BLOCKS.register("rock", () -> new Block(BlockBehaviour.Properties.of().mapColor(MapColor.STONE)));

public ExampleMod(FMLJavaModLoadingContext context) {
  BLOCKS.register(context.getModEventBus());
}
```

### `RegisterEvent`

`RegisterEvent` 是第二种注册对象的方式。该[event] 在模组构造完成后、配置加载之前，为每个注册表触发。通过传入注册表键、注册名和对象本身调用 `#register` 来注册对象。还有一个重载的 `#register` 接口接受一个 helper consumer，用来在给定名称下注册对象；推荐使用该方法以避免不必要的对象创建。

示例（事件处理器在模组事件总线上注册）：

```java
@SubscribeEvent
public void register(RegisterEvent event) {
  event.register(ForgeRegistries.Keys.BLOCKS,
    helper -> {
      helper.register(ResourceLocation.fromNamespaceAndPath(MODID, "example_block_1"), new Block(...));
      helper.register(ResourceLocation.fromNamespaceAndPath(MODID, "example_block_2"), new Block(...));
      helper.register(ResourceLocation.fromNamespaceAndPath(MODID, "example_block_3"), new Block(...));
      // ...
    }
  );
}
```

### 不是所有的注册表都是 Forge 封装的

并非所有注册表都会被 Forge 包装。有些是静态注册表（例如 `LootItemConditionType`），可以安全使用；也有一些是动态注册表（例如 `ConfiguredFeature` 及其他一些世界生成相关的注册表），通常以 JSON 形式表示。`DeferredRegister#create` 提供了重载，允许模组指定要为其创建 `RegistryObject` 的原版注册表键。注册方法与将 `DeferredRegister` 附加到模组事件总线的方式与其它 `DeferredRegister` 相同。

!!! important
    动态注册表对象**只能**通过数据文件（例如 JSON）注册，**不能**在代码中注册。

```java
private static final DeferredRegister<LootItemConditionType> REGISTER = DeferredRegister.create(Registries.LOOT_CONDITION_TYPE, "examplemod");

public static final RegistryObject<LootItemConditionType> EXAMPLE_LOOT_ITEM_CONDITION_TYPE = REGISTER.register("example_loot_item_condition_type", () -> new LootItemConditionType(...));
```

!!! note
    有些类不能直接注册自身，而是注册其对应的 `*Type` 工厂类，并在前者的构造函数中使用。例如 [`BlockEntity`][blockentity] 有对应的 `BlockEntityType`，`Entity` 有 `EntityType`。这些 `*Type` 类是按需创建包含类型实例的工厂。
    
    这些工厂通常通过其 `*Type$Builder` 创建。例如（`REGISTER` 表示 `DeferredRegister<BlockEntityType>`）：
    ```java
    public static final RegistryObject<BlockEntityType<ExampleBlockEntity>> EXAMPLE_BLOCK_ENTITY = REGISTER.register(
      "example_block_entity", () -> BlockEntityType.Builder.of(ExampleBlockEntity::new, EXAMPLE_BLOCK.get()).build(null)
    );
    ```

引用已注册对象
------------------------------

已注册对象在创建并注册后**不应**被直接存入字段。它们应在每次对应注册表的 `RegisterEvent` 触发时重新创建并注册。这允许在未来版本的 Forge 中动态加载与卸载模组。

已注册对象应始终通过 `RegistryObject` 或带 `@ObjectHolder` 注解的字段来引用。

### 使用 `RegistryObject`

`RegistryObject` 可在对象可用后用于检索已注册对象的引用。`DeferredRegister` 使用它来返回对已注册对象的引用。它们在对应注册表的 `RegisterEvent` 被调用后以及 `@ObjectHolder` 注入后更新引用。

要获取 `RegistryObject`，可调用 `RegistryObject#create` 并传入 `ResourceLocation` 与目标对象对应的 `IForgeRegistry`。也可以通过提供注册表名来支持自定义注册表。将 `RegistryObject` 存为 `public static final` 字段，并在需要注册对象时调用 `#get`。

使用 `RegistryObject` 的示例：

```java
public static final RegistryObject<Item> BOW = RegistryObject.create(ResourceLocation.withDefaultNamespace("bow"), ForgeRegistries.ITEMS);

// 假设 'neomagicae:mana_type' 是有效注册表且 'neomagicae:coffeinum' 是该注册表中的有效对象
public static final RegistryObject<ManaType> COFFEINUM = RegistryObject.create(ResourceLocation.fromNamespaceAndPath("neomagicae", "coffeinum"), ResourceLocation.fromNamespaceAndPath("neomagicae", "mana_type"), "neomagicae"); 
```

### 使用 `@ObjectHolder`

通过使用 `@ObjectHolder` 注解类或字段并提供足够信息构造 `ResourceLocation`，注册表中的对象可以注入到 `public static` 字段中。

`@ObjectHolder` 的规则如下：

* 若类用 `@ObjectHolder` 注解且未显式定义命名空间，则该值将作为该类内所有字段的默认命名空间；
* 若类用 `@Mod` 注解，则模组 id（modid）将作为该类内所有注解字段的默认命名空间（若未显式定义）；
* 字段会在以下条件下被视为可注入：
  * 其至少具有 `public static` 修饰符；
  * 字段本身使用 `@ObjectHolder` 注解，且：
    * 名称值已显式定义；且
    * 注册表名值已显式定义；
  * _若字段没有对应的注册表或名称，将在编译时抛出异常。_
* _若生成的 `ResourceLocation` 不完整或无效（路径中包含非法字符），将抛出异常_
* 若没有发生其它错误或异常，该字段将被注入；
* 若上述规则均不适用，则不会进行任何操作（并且可能记录一条消息）。

`@ObjectHolder` 注入会在对应注册表的 `RegisterEvent` 触发后与 `RegistryObject` 一起执行。

!!! note
    若注入时注册表中不存在对应对象，将记录调试信息且不会注入任何值。

示例：

```java
class Holder {
  @ObjectHolder(registryName = "minecraft:enchantment", value = "minecraft:flame")
  public static final Enchantment flame = null;     // 注解存在。[public static] 必需。[final] 可选。
                                                    // 注册表名已显式定义："minecraft:enchantment"
                                                    // 资源位置已显式定义："minecraft:flame"
                                                    // 注入目标：从 [Enchantment] 注册表中注入 "minecraft:flame"

  public static final Biome ice_flat = null;        // 字段未注解，因而被忽略。

  @ObjectHolder("minecraft:creeper")
  public static Entity creeper = null;              // 注解存在，但字段缺少注册表信息。
                                                    // 这将导致编译时异常。

  @ObjectHolder(registryName = "potion")
  public static final Potion levitation = null;     // 注解存在。[public static] 必需。[final] 可选。
                                                    // 注册表名显式定义："minecraft:potion"
                                                    // 字段未指定资源位置，这将导致编译时异常。
}
```

创建自定义 Forge 注册表
--------------------------------

自定义注册表通常可以简单地实现为键到值的映射（map）。这种方式常见但会强制对注册表存在的硬依赖，并且需要手动处理任何需要在两侧同步的数据。自定义 Forge 注册表提供了一个替代方案，支持软依赖并提供更好的管理与自动跨侧同步（除非另行指定）。由于对象也使用 Forge 注册表，注册过程因此保持一致化。

自定义 Forge 注册表可通过 `RegistryBuilder` 创建，方式为在 `NewRegistryEvent` 中或通过 `DeferredRegister`。`RegistryBuilder` 可接收各种参数（例如注册表名称、id 范围以及在注册表上发生不同事件时的回调）。新的注册表会在 `NewRegistryEvent` 完成触发后注册到 `RegistryManager`。

任何新建注册表应使用其关联的[注册方法][registration]来注册对应对象。

### 使用 `NewRegistryEvent`

在 `NewRegistryEvent` 中，调用 `#create` 并传入 `RegistryBuilder` 将返回被供应器（supplier）封装的注册表。该供应器封装的注册表在 `NewRegistryEvent` 完成发布到模组事件总线后即可访问。若在 `NewRegistryEvent` 完成前尝试从供应器获取自定义注册表，将得到 `null`。

#### 新的数据包（Datapack）注册表

可以在模组事件总线上通过 `DataPackRegistryEvent$NewRegistry` 添加新的数据包注册表。通过传入表示注册表名称的 `ResourceKey` 与用于从 JSON 编码/解码数据的 `Codec` 来创建该注册表。可选地提供一个 `Codec` 以便将数据包注册表与客户端同步。

!!! important
    数据包注册表不能通过 `DeferredRegister` 创建。只能通过该事件创建。

### 使用 `DeferredRegister`

`DeferredRegister` 方法本质上是对上述事件的包装。一旦在常量字段中通过接收注册表名和模组 id 的 `#create` 重载创建了 `DeferredRegister`，可通过 `DeferredRegister#makeRegistry` 构造注册表。该方法接受一个包含额外配置的 `RegistryBuilder`，并默认会设置名称（`#setName`）。由于该方法可能在任意时间返回，因此返回的是被供应器封装的 `IForgeRegistry`。

!!! important
    必须在把 `DeferredRegister` 添加到模组事件总线（通过 `#register`）之前调用 `DeferredRegister#makeRegistry`。`#makeRegistry` 会在 `NewRegistryEvent` 期间通过 `#register` 方法创建注册表。

处理丢失的条目
------------------------

在某些情况下，当模组被更新或移除时，某些注册表对象可能不再存在。可以通过第三类注册表事件 `MissingMappingsEvent` 指定处理丢失映射的行为。在此事件中，可通过 `#getMappings`（传入注册表键与模组 id）获取缺失映射列表，或通过 `#getAllMappings`（传入注册表键）获取所有映射。

!!! important
    `MissingMappingsEvent` 在 **Forge** 事件总线上触发。

对于每个 `Mapping`，可选择四种映射处理方式之一：

| Action | Description                          |
| :----: | :----------------------------------- |
| IGNORE | 忽略缺失条目并放弃该映射。           |
|  WARN  | 在日志中生成警告。                   |
|  FAIL  | 阻止世界加载。                       |
| REMAP  | 将该条目重映射到已注册且非空的对象。 |

若未指定任何动作，则默认行为是通知用户关于缺失条目的信息，并询问用户是否仍希望加载世界。除重映射外的其它动作会阻止任何其它注册对象占用该 id，以防将来该关联条目再次添加到游戏中。

[ResourceLocation]: ./resources.md#resourcelocation
[registration]: #methods-for-registering
[event]: ./events.md
[blockentity]: ../blockentities/index.md

