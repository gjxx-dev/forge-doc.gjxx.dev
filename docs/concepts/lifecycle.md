# 模组生命周期
==============

在模组加载过程中，各种生命周期事件会在模组专属的事件总线上被触发。在这些事件中会执行许多操作，例如[注册对象][registering]、为[数据生成][datagen]做准备，或与其他模组进行[通信][imc]。

事件监听器应使用 `@EventBusSubscriber(bus = Bus.MOD)` 注解注册，或在模组构造函数中注册：

```Java
@Mod.EventBusSubscriber(modid = "mymod", bus = Mod.EventBusSubscriber.Bus.MOD)
public class MyModEventSubscriber {
  @SubscribeEvent
  static void onCommonSetup(FMLCommonSetupEvent event) { ... }
}

@Mod("mymod")
public class MyMod {
  public MyMod(FMLModLoadingContext context) {
    context.getModEventBus().addListener(this::onCommonSetup);
  } 

  private void onCommonSetup(FMLCommonSetupEvent event) { ... }
}
```

!!! warning
    大多数生命周期事件是并行触发的：所有模组将并发地接收相同事件。
    
    模组*必须*注意线程安全，特别是在调用其他模组的 API 或访问原版系统时。可通过 `ParallelDispatchEvent#enqueueWork` 将代码延后执行以保证安全。

注册事件
---------------

注册事件在模组实例构造之后触发。有三类：`NewRegistryEvent`、`DataPackRegistryEvent$NewRegistry` 与 `RegisterEvent`。这些事件在模组加载期间同步触发。

`NewRegistryEvent` 允许模组使用 `RegistryBuilder` 注册自定义注册表（registries）。

`DataPackRegistryEvent$NewRegistry` 允许模组通过提供 `Codec` 来注册自定义的数据包（datapack）注册表，以便从 JSON 编码与解码对象。

`RegisterEvent` 用于将对象[注册到注册表][registering]。该事件会针对每个注册表触发。

!!! note
    尽可能优先使用 [DeferredRegister][registering]，而不是直接使用注册事件。DeferredRegister 会替你处理时机问题，且更不容易出错。

数据生成
---------------

如果游戏配置为运行[数据生成器][datagen]，那么 `GatherDataEvent` 会是最后触发的事件。该事件用于向关联的数据生成器注册模组的数据提供器（data providers）。该事件同样是同步触发的。

通用设置（Common Setup）
------------

`FMLCommonSetupEvent` 用于客户端与服务端通用的初始化，例如注册 [capabilities][capabilities]。

按侧设置（Sided Setup）
-----------

按侧设置事件会在对应的[物理侧][sides]触发：`FMLClientSetupEvent` 在物理客户端触发，`FMLDedicatedServerSetupEvent` 在专用服务器触发。物理侧特有的初始化（例如注册客户端按键绑定）应在相应事件中进行。

模组间通信（InterModComms）
-------------

此处用于发送跨模组兼容性消息。相关事件有 `InterModEnqueueEvent` 与 `InterModProcessEvent`。

`InterModComms` 类负责保存要发送到其他模组的消息。其方法可在生命周期事件期间安全调用，因为其底层由 `ConcurrentMap` 支持。

在 `InterModEnqueueEvent` 中，使用 `InterModComms#sendTo` 向不同模组发送消息。该方法接收目标模组 id、与消息数据相关联的键，以及持有消息数据的 supplier。此外，可指定消息的发送者；默认情况下为调用方的模组 id。

在 `InterModProcessEvent` 中，使用 `InterModComms#getMessages` 获取所有接收消息的流。传入的模组 id 通常为调用方法的模组 id。也可以传入谓词来过滤消息键。此方法返回 `IMCMessage` 的流，这些对象包含数据的发送者、接收者、数据键与提供的数据本身。

!!! note
    还有两个其他的生命周期事件：`FMLConstructModEvent`（在模组实例构造后但在 `RegisterEvent` 前触发）以及 `FMLLoadCompleteEvent`（在 `InterModComms` 事件之后触发，表示模组加载过程完成）。

[registering]: ./registries.md#methods-for-registering
[capabilities]: ../datastorage/capabilities.md
[datagen]: ../datagen/datagen.md
[imc]: ./lifecycle.md#intermodcomms
[sides]: ./sides.md

