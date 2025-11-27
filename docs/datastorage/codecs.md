# Codecs

Codecs 是 Mojang 的 [DataFixerUpper] 提供的一种序列化工具，用于描述对象如何在不同格式之间相互转换，例如用于 JSON 的 `JsonElement` 与用于 NBT 的 `Tag` 之间的转换。

## 使用 Codecs

Codecs 主要用于将 Java 对象编码（序列化）为某种数据格式类型，或将已格式化的数据解码（反序列化）回对应的 Java 类型。通常分别通过 `Codec#encodeStart` 和 `Codec#parse` 实现。

### DynamicOps

为了确定使用哪种中间文件格式进行编码与解码，`#encodeStart` 和 `#parse` 都需要一个 `DynamicOps` 实例来定义该格式下的数据表示。

[DataFixerUpper] 库包含用于 JSON 的 `JsonOps`，其操作对象为 `Gson` 的 `JsonElement` 实例。`JsonOps` 支持两种 `JsonElement` 序列化方式：`JsonOps#INSTANCE`（常规 JSON）和 `JsonOps#COMPRESSED`（将数据压缩为单个字符串）。

```java
// 将 Java 对象编码为常规 JsonElement
exampleCodec.encodeStart(JsonOps.INSTANCE, exampleObject);

// 将 Java 对象编码为压缩的 JsonElement
exampleCodec.encodeStart(JsonOps.COMPRESSED, exampleObject);

// 将 JsonElement 解码为 Java 对象（假设 JsonElement 已按常规方式解析）
exampleCodec.parse(JsonOps.INSTANCE, exampleJson);
```

Minecraft 也提供 `NbtOps` 用于对 NBT 数据（`Tag` 实例）进行编解码，可通过 `NbtOps#INSTANCE` 访问。

```java
// 将 Java 对象编码为 Tag
exampleCodec.encodeStart(NbtOps.INSTANCE, exampleObject);

// 将 Tag 解码为 Java 对象
exampleCodec.parse(NbtOps.INSTANCE, exampleNbt);
```

#### 格式转换

`DynamicOps` 也可用于在两种不同编码格式间转换，例如使用 `#convertTo` 并提供目标 `DynamicOps` 与待转换的编码对象：

```java
// 将 Tag 转换为 JsonElement
JsonElement convertedJson = NbtOps.INSTANCE.convertTo(JsonOps.INSTANCE, exampleTag);
```

### DataResult

使用 codecs 编码或解码返回 `DataResult`，该对象包含转换后的实例或错误信息。转换成功时，可通过 `#result` 获取包含成功对象的 `Optional`；转换失败时，可通过 `#error` 获取包含错误信息以及部分转换结果的 `PartialResult`。

`DataResult` 提供多种方法用于处理结果或错误，例如 `#resultOrPartial` 会在成功时返回结果的 `Optional`，失败时返回部分结果并接收一个错误消息消费者用于报告错误。

```java
DataResult<ExampleJavaObject> result = exampleCodec.parse(JsonOps.INSTANCE, exampleJson);

result
  .resultOrPartial(errorMessage -> /* 处理错误信息 */)
  .ifPresent(decodedObject -> /* 处理解码对象 */);
```

## 已有的 Codecs

### 基本类型（Primitives）

`Codec` 类包含若干常用原始类型的静态 codec 实例（如 `INT`、`STRING` 等）。

### 原版与 Forge 提供的 Codecs

Minecraft 与 Forge 为经常需要编码/解码的对象定义了许多 codecs，例如 `ResourceLocation#CODEC`、用于 ISO8601 格式 Instant 的 `ExtraCodecs#INSTANT_ISO8601`、以及 `CompoundTag#CODEC` 等。

!!! warning
    `CompoundTag` 无法通过 `JsonOps` 从 JSON 解码数字列表。`JsonOps` 在转换时会将数字视为最窄类型，而 `ListTag` 要求元素具有特定类型，类型不一致时（例如 `64` 被视为 `byte` 而 `384` 被视为 `short`）会在转换时抛出错误。

此外，注册表（registries）也有相应的 codecs（例如 `Registry#BLOCK` 或 `ForgeRegistries#BLOCKS` 对应 `Codec<Block>`）。`Registry#byNameCodec` 与 `IForgeRegistry#getCodec` 会把注册对象编码为注册名，若压缩则为整数标识符；原版注册表还提供 `Registry#holderByNameCodec`，将注册名编码并解码为包含 `Holder` 的注册对象。

## 创建 Codecs

可以为任意对象创建 codec。为便于理解，文档中将展示对应的 JSON 表示。

### Records

可以使用 record 来定义对象的 codec。record codec 通过 `RecordCodecBuilder#create` 创建，传入一个定义 `Instance` 的函数并返回对象的构造方法引用。

```java
public static final Codec<SomeObject> RECORD_CODEC = RecordCodecBuilder.create(instance ->
  instance.group(
    Codec.STRING.fieldOf("s").forGetter(SomeObject::s),
    Codec.INT.optionalFieldOf("i", 0).forGetter(SomeObject::i),
    Codec.BOOL.fieldOf("b").forGetter(SomeObject::b)
  ).apply(instance, SomeObject::new)
);
```

### Transformers

可以通过映射方法将 codec 转换为等价或部分等价的表示，使用 `#xmap`、`#comapFlatMap` 等方法并在需要时返回 `DataResult` 来报告错误。

### 其它（范围、默认值、列表、映射、对偶、Either 等）

Codecs 支持范围（range）校验、默认值、列表（`listOf`）、映射（`unboundedMap`）、对偶（`pair`）、Either（`either`）以及基于类型分发（`dispatch`）等高级用法，文档示例说明了这些用法的基本模式。
