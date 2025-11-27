# SimpleImpl

`SimpleImpl` 是围绕 `SimpleChannel` 类构建的数据包系统名称，使用此系统是客户端与服务端之间发送自定义数据的最简单方式。

快速开始
---------

首先需要创建 `SimpleChannel` 对象。建议在独立类（如 `ModidPacketHandler`）中以静态字段方式创建：

```java
private static final String PROTOCOL_VERSION = "1";
public static final SimpleChannel INSTANCE = NetworkRegistry.newSimpleChannel(
  ResourceLocation.fromNamespaceAndPath("mymodid", "main"),
  () -> PROTOCOL_VERSION,
  PROTOCOL_VERSION::equals,
  PROTOCOL_VERSION::equals
);
```

第一个参数为通道名称；第二个参数为返回当前网络协议版本的 `Supplier<String>`；第三和第四个参数为 `Predicate<String>`，分别用于检查传入连接协议版本与客户端或服务端是否兼容。上例直接比较 `PROTOCOL_VERSION`，意味着客户端与服务端的协议版本必须相同，否则 FML 将拒绝登录。

版本检查（Version Checker）
---------------------------

若你的模组不要求对端必须具备特定通道或运行 Forge，请正确处理版本兼容检查器（`Predicate<String>`），以支持 `NetworkRegistry` 定义的额外 “meta-versions”：

* `ABSENT`：对端缺少该通道（但仍可能是 Forge 端并加载其它模组）。
* `ACCEPTVANILLA`：对端为原版（或非 Forge）客户端。

若对两个检查均返回 `false`，表示此通道必须出现在另一端；上述值也用于服务器列表 ping 的兼容性检查，以决定多人界面中的绿色勾/红叉显示。

注册数据包
---------

接下来声明需要发送与接收的消息类型，使用 `INSTANCE#registerMessage`，该方法接受五个参数：

- 第一个参数为分辨符（discriminator），是通道内唯一的包 ID；建议用局部变量并在每次注册后执行 `id++` 以保证唯一性。
- 第二个参数为消息类 `MSG`。
- 第三个参数为 `BiConsumer<MSG, FriendlyByteBuf>`，用于将消息编码进 `FriendlyByteBuf`。
- 第四个参数为 `Function<FriendlyByteBuf, MSG>`，用于从 `FriendlyByteBuf` 解码消息。
- 第五个参数为 `BiConsumer<MSG, Supplier<NetworkEvent.Context>>`，用于处理消息。

后三个参数可以使用静态或实例方法的引用；例如实例方法 `MSG#encode(FriendlyByteBuf)` 也满足 `BiConsumer<MSG, FriendlyByteBuf>` 的要求。

处理数据包
---------

包处理器可访问消息对象与网络上下文（context），上下文允许访问发送该包的玩家（在服务端）并提供线程安全的任务排队方式：

```java
public static void handle(MyMessage msg, Supplier<NetworkEvent.Context> ctx) {
  ctx.get().enqueueWork(() -> {
    // 需要线程安全执行的操作
    ServerPlayer sender = ctx.get().getSender();
    // 执行处理逻辑
  });
  ctx.get().setPacketHandled(true);
}
```

服务端向客户端发送的包应在另一个类中处理，并通过 `DistExecutor#unsafeRunWhenOn` 包装以确保仅在物理客户端执行。

```java
public static void handle(MyClientMessage msg, Supplier<NetworkEvent.Context> ctx) {
  ctx.get().enqueueWork(() ->
    DistExecutor.unsafeRunWhenOn(Dist.CLIENT, () -> () -> ClientPacketHandlerClass.handlePacket(msg, ctx))
  );
  ctx.get().setPacketHandled(true);
}
```

注意必须调用 `#setPacketHandled` 告知网络系统该包已被成功处理。

!!! warning
    自 Minecraft 1.8 起，包默认在网络线程处理，因此处理器不能直接交互大部分游戏对象。应使用 `NetworkEvent$Context#enqueueWork(Runnable)` 将工作排到主线程执行。

!!! warning
    在服务端处理包时应采取防御性编程，客户端可能发送畸形或恶意数据。常见问题为“任意区块生成”漏洞：若信任客户端发送的区块坐标并访问未加载区域，服务端可能被迫生成大量区块并写盘，造成严重性能与存储问题。通用规则是仅在 `Level#hasChunkAt` 为真时访问区块或方块实体。

发送数据包
---------

发送到服务端：

```java
INSTANCE.sendToServer(new MyMessage());
```

发送到客户端（示例）：

```java
// 发送给单个玩家
INSTANCE.send(PacketDistributor.PLAYER.with(serverPlayer), new MyMessage());

// 发送给观察某区块的所有玩家
INSTANCE.send(PacketDistributor.TRACKING_CHUNK.with(levelChunk), new MyMessage());

// 发送给所有连接的玩家
INSTANCE.send(PacketDistributor.ALL.noArg(), new MyMessage());
```

更多 `PacketDistributor` 选项请参考其类文档。
