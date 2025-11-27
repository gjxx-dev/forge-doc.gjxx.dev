# 标签（Tags）

标签是游戏中用于将相关对象分组并提供快速成员检测的通用集合。

查找标签
------------
查找已有标签时，主要有两个地方可查：

### 原版（Vanilla）标签
原版标签在 `net.minecraft.tags` 包中声明。例如 `BlockTags` 包含所有原版方块标签，`BiomeTags` 包含所有原版生物群系标签，依此类推。

### Forge 标签
Forge 提供了对模组有用的额外标签，既包含 Forge 特有标签，也包含在多个加载器间成为事实标准的通用标签。可在 `net.minecraftforge.common.Tags` 类中找到这些标签。类中字段的方法名和注释会帮助区分哪些是 Forge 特有标签，哪些是通用标签。

!!! warning
    Forge 中常见的 `c` 命名空间标签在各加载器间通常通用，但其他加载器可能在相同 `c` 命名空间下有额外的加载器专属标签。编写跨加载器（multi-loader）模组时，建议检查每个加载器的标签以确保兼容性；若在其他加载器看到某个 `c` 标签但在 Forge 中缺失，该标签在 Forge 下可能位于 `forge` 命名空间，直到它成为跨加载器的通用标签。

### Forge 附带标签的完整列表
Forge 在原版之上添加的完整标签列表可见[此处][forgebundledtagslist]。

声明自定义分组
----------------------------
标签在模组的数据包（datapack）中声明。例如，一个标识为 `modid:foo/tagname` 的 `TagKey<Block>` 将引用位于 `/data/<modid>/tags/blocks/foo/tagname.json` 的标签。方块、物品、实体类型、流体及游戏事件等使用复数形式的文件夹（例如 `tags/blocks`），而其它注册表使用单数形式（例如 `potion`）。

你也可以通过声明自己的 JSON 来追加或覆盖其他域（例如 Vanilla）中声明的标签。例如，要将自模组的树苗加入原版的 saplings 标签，可在 `/data/minecraft/tags/blocks/saplings.json` 中声明；在资源重载时，若 `replace` 选项为 false，Vanilla 会将所有条目合并为一个标签。

若 `replace` 为 true，则在该 JSON 之前的所有条目将被移除。

若列出的值不存在，会导致标签出错，除非使用 `id` 字符串和 `required` 设置为 false，如下示例：

```js
{
  "replace": false,
  "values": [
    "minecraft:gold_ingot",
    "mymod:my_ingot",
    {
      "id": "othermod:ingot_other",
      "required": false
    }
  ]
}
```

关于基本语法的说明请参见 [Vanilla wiki][tags]。

Forge 对原版语法也有扩展。你可以声明一个与 `values` 相同格式的 `remove` 数组，列出的条目将从标签中移除。这相当于对 `replace` 的更细粒度控制。

在代码中使用标签
------------------
服务器会在登录与重载时自动将所有注册表的标签发送给远程客户端。`Block`、`Item`、`EntityType`、`Fluid` 与 `GameEvent` 等对象会被特别处理，它们拥有 `Holder`，允许通过对象自身访问其可用标签。

!!! note
    将来 Minecraft 可能移除侵入式（intrusive）`Holder`。若被移除，可使用下述方法查询关联的 `Holder`。

### ITagManager

Forge 封装的注册表提供了通过 `ITagManager` 创建与管理标签的辅助方法，可由 `IForgeRegistry#tags` 获取。可使用 `#createTagKey` 或 `#createOptionalTagKey` 创建标签，亦可通过 `#getTag` 或 `#getReverseTag` 检查标签或注册表对象。

#### 自定义注册表
自定义注册表可在构造其 `DeferredRegister` 时通过 `#createTagKey` 或 `#createOptionalTagKey` 创建标签。随后可通过调用 `DeferredRegister#makeRegistry` 获得的 `IForgeRegistry` 检查标签或注册表对象。

### 引用标签的方法

有四种方式创建标签包装器（tag wrapper）：

|              方法               | 适用                                                                                                                                                                                                     |
| :-----------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|         `*Tags#create`          | 适用于 BannerPattern、Biome、Block、CatVariant、DamageType、EntityType、FlatLevelGeneratorPreset、Fluid、GameEvent、Instrument、Item、PaintingVariant、PoiType、Structure 与 WorldPreset（`*` 代表类型） |
|   `ITagManager#createTagKey`    | Forge 封装的原版注册表（可从 `ForgeRegistries` 获取）                                                                                                                                                    |
| `DeferredRegister#createTagKey` | 自定义 Forge 注册表                                                                                                                                                                                      |
|         `TagKey#create`         | 未被 Forge 封装的原版注册表（可从 `Registry` 获取）                                                                                                                                                      |

注册表对象可通过自身的 `Holder` 或通过 `ITag`/`IReverseTag`（对应原版或 Forge 注册表对象）来检查标签。

示例：

```java
public static final TagKey<Item> myItemTag = ItemTags.create(ResourceLocation.fromNamespaceAndPath("mymod", "myitemgroup"));

public static final TagKey<Potion> myPotionTag = ForgeRegistries.POTIONS.tags().createTagKey(ResourceLocation.fromNamespaceAndPath("mymod", "mypotiongroup"));

public static final TagKey<VillagerType> myVillagerTypeTag = TagKey.create(Registries.VILLAGER_TYPE, ResourceLocation.fromNamespaceAndPath("mymod", "myvillagertypegroup"));

// 使用示例：
ItemStack stack = /*...*/;
boolean isInItemGroup = stack.is(myItemTag);

Potion potion = /*...*/;
boolean isInPotionGroup = ForgeRegistries.POTIONS.tags().getTag(myPotionTag).contains(potion);

ResourceKey<VillagerType> villagerTypeKey = /*...*/;
boolean isInVillagerTypeGroup = BuiltInRegistries.VILLAGER_TYPE.getHolder(villagerTypeKey).map(holder -> holder.is(myVillagerTypeTag)).orElse(false);
```

命名与约定
-----------
若遵循下列约定可以促进生态系统间的兼容性：

* 若存在适合的 Vanilla 标签，请将你的方块或物品加入该标签。参见 [Vanilla 标签列表][taglist]。
* 若存在适合的 Forge 标签，请将你的方块或物品加入该标签。Forge 声明的标签列表见 [GitHub][forgetags]。
* 若希望创建一个应被社区共享的通用分组，使用 `forge` 命名空间而非你的 mod id。
* 标签命名应遵循原版约定，尤其是物品与方块分组采用复数形式（例如 `minecraft:logs`、`minecraft:saplings`）。
* 物品标签应按类型分目录组织（例如 `forge:ingots/iron`、`forge:nuggets/brass`）。

从 OreDictionary 迁移
----------------------------

* 对于配方，标签可在原版配方格式中直接使用。
* 在代码中匹配物品，请参考上文。
* 若要声明新类型的物品分组，请遵循命名约定：
  * 使用 `domain:type/material`。当名称为所有模组作者应采用的通用名称时，使用 `forge` 域。
  * 例如，黄铜锭（brass ingots）应注册为 `forge:ingots/brass`，钴金属碎片（cobalt nuggets）应为 `forge:nuggets/cobalt`。

在配方与进度中使用标签
----------------------
标签在原版中被直接支持。关于使用方法，请参考原版的[配方][recipes] 与[进度][advancements] 页面。

[datapack]: ./index.md
[tags]: https://minecraft.wiki/w/Tag#JSON_format
[taglist]: https://minecraft.wiki/w/Tag#List_of_tags
[forgetags]: https://github.com/MinecraftForge/MinecraftForge/tree/1.19.x/src/generated/resources/data/forge/tags
[forgebundledtagslist]: ./tagslist.md

