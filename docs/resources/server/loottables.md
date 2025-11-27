# 战利品表（Loot Tables）

战利品表是用于指定在各种动作或场景发生时应执行何种物品生成逻辑的文件。虽然原版系统以物品生成为主，但该系统可以扩展以执行任意定义的操作。

数据驱动的表
------------------

原版中的大多数战利品表都是通过 JSON 数据驱动的。这意味着无需模组即可创建新的战利品表，只需一个[数据包][datapack]。关于如何创建并将这些战利品表放入模组 `resources` 文件夹的完整说明请见 [Minecraft Wiki][wiki]。

使用战利品表
------------------

战利品表通过其 `ResourceLocation` 引用，位于 `data/<namespace>/loot_tables/<path>.json`。可通过 `LootDataResolver#getLootTable` 获取与该引用关联的 `LootTable`，而 `LootDataResolver` 可由 `MinecraftServer#getLootData` 获得。

生成战利品时会传入参数。`LootParams` 包含生成所在的关卡、用于影响生成的幸运值（luck）、定义场景上下文的 `LootContextParam`s，以及在触发时应包含的任何动态信息。可使用 `LootParams$Builder` 构造 `LootParams`，并通过 `LootParams$Builder#create` 传入 `LootContextParamSet` 来构建。

战利品表也可能包含上下文。`LootContext` 接收已构建的 `LootParams` 并可设置随机种子实例。上下文通过 `LootContext$Builder` 创建，并通过 `LootContext$Builder#create` 传入可为空的 `ResourceLocation`（代表要使用的随机实例）来构建。

可使用若干方法用 `LootParams` 或 `LootContext` 来生成 `ItemStack`：

|        方法         | 描述                     |
| :-----------------: | :----------------------- |
| `getRandomItemsRaw` | 消耗战利品表生成的物品。 |
|  `getRandomItems`   | 返回战利品表生成的物品。 |
|       `fill`        | 用生成的战利品填充容器。 |

!!! note
    战利品表原本为生成物品设计，因此这些方法期望处理 `ItemStack`。

附加功能
-------------------

Forge 为战利品表提供了一些扩展以便更精细地控制系统行为。

### `LootTableLoadEvent`

`LootTableLoadEvent` 是在 Forge 事件总线上触发的事件，当某个战利品表被加载时触发。若事件被取消，则会加载一个空的战利品表。

!!! important
    请**不要**通过该事件修改战利品表的掉落。此类修改应使用[全局战利品修饰器][glm]完成。

### Loot Pool 名称

可以通过 `name` 键为 loot pool 命名。任何未命名的 loot pool 将以 `custom#` 前缀加上池的哈希码作为名称。

```js
{
  "name": "example_pool",
  "rolls": { /*...*/ },
  "entries": { /*...*/ }
}
```

### 掠夺（Looting）修饰

现在战利品表也会受 Forge 事件 `LootingLevelEvent` 的影响，除此之外仍受掠夺附魔效果影响。

### 额外上下文参数

Forge 扩展了某些参数集以涵盖可能适用但原版缺失的上下文。例如，`LootContextParamSets#CHEST` 现在允许 `LootContextParams#KILLER_ENTITY`（箱车作为实体被破坏也会触发），`LootContextParamSets#FISHING` 也允许 `LootContextParams#KILLER_ENTITY`。

### 熔炼产生多个物品

使用 `SmeltItemFunction` 时，熔炼配方将返回实际数量的物品而不是单个熔炼物（例如，若某熔炼配方返回 3 个物品，且有 3 个掉落，则结果为 9 个熔炼物而非 3）。

### 战利品表 ID 条件

Forge 添加了一个额外的 `LootItemCondition`，允许仅在特定表下生成某些条目。该条件通常在[全局战利品修饰器][glm]中使用。

```js
{
  "conditions": [
    {
      "condition": "forge:loot_table_id",
      "loot_table_id": "minecraft:blocks/dirt"
    }
  ]
}
```

### 工具能否执行动作条件

Forge 添加了一个 `LootItemCondition`，用于检查给定 `LootContextParams#TOOL` 是否可以执行指定的 `ToolAction`。

```js
{
  "conditions": [
    {
      "condition": "forge:can_tool_perform_action",
      "action": "axe_strip"
    }
  ]
}
```

[datapack]: https://minecraft.wiki/w/Data_pack
[wiki]: https://minecraft.wiki/w/Loot_table
[event]: ../../concepts/events.md#creating-an-event-handler
[glm]: ./glm.md

