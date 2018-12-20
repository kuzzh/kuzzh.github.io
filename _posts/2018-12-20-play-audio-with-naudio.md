---
layout: post
title: 使用 NAudio 播放音频文件
categories: [技术, NAudio]
date: 2018-12-20
---

> Author: zhoubing
> 
> Created Time: 2017-10-25
> 
> 这篇文章基本翻译自 [Github:Playing an Audio File](https://github.com/naudio/NAudio/wiki/Playing-an-Audio-File)，其中有一些小的改动，由于水平有限翻译的不是那么准确，需要了解详细信息的可以点击链接去查看原文。

假设你只是想简单播放一个本地音频文件，比如一个 WAV 文件或者一个 MP3 文件。使用 NAudio 应该怎么做呢？

### 选择输出设备

NAudio 可以访问几种不同类型的 Windows 音频 API，这需要我们做几件事。首先，创建一个输出设备。在 NAudio 里输出设备是指实现了 `IWaveOut` 接口的类。在这个例子里我们选择 `WaveOutEvent`。`WaveOutEvent` 使用了遗留的 [waveOut...APIs](https://msdn.microsoft.com/en-us/library/dd743866(v=vs.85).aspx)，并且可以向后兼容 Windows XP，同时还能很好的处理重采样，使你不用操心正在播放的文件的采样率。最后，这个特殊的类使用了“事件”回调在后台线程播放音频。这样做的好处是你可以在 `WPF`、`WinForms`、`Console App` 甚至是 Windows 服务里播放音频。

### 选择声卡

创建 `WaveOutEvent` 实例非常简单。默认情况下它会选择“device 0”，表示使用计算机默认声卡。如果你的计算机有不止一个声卡，你也可以在构造函数里传入一个设备编号来选择不同的声卡。

### 创建输出设备

创建一个输出设备：

	waveOut = WaveOutEvent();

通常情况下你应该将 `waveOut` 保存为类的一个字段而不是局部变量，因为你可能会播放很长一段时间，也不想在回放期间阻塞代码。在回放结束时调用 `Dispose` 方法释放资源。

### 加载文件

现在我们需要创建一个“Wave Provider”供输出设备回放音频。你可以使用任何实现了 IWaveProvider 接口的类（或者 ISampleProvider 接口，这要归功于一个扩展方法实现了格式转换）。对于 WAV 文件，可以使用 `WavFileReader`，对于 MP3 文件，可以使用 `Mp3FileReader`。其他还有诸如 `AiffFileReader` 和 `WmaFileReader` 这两个文件读取类（在另一个程序集中）。

> **注意**
> 
> 如果你用 Windows Vista 或者以上版本，那么你应该考虑使用 `MediaFoundationReader`，这个类使用了 Windows Media Foundation，可以读取几乎所有类型的音频文件，包括 WAV、WMA、AAC、MP3，甚至可以从很多不同格式的视频文件里读取音频。当然，这些都取决于你安装了哪些媒体解码库。

这个例子里为了简单我们使用 `Mp3FileReader` 加载一个 MP3 文件。将我们的输出设备类和文件读取类都作为私有字段保存到我们的类里，这样在回放结束后可以释放他们（也可以在回放期间重新定位播放位置）。

	mp3Reader = new Mp3FileReader("example.mp3");

### 回放初始化

现在我们已经创建了输出设备和“wave provider”，接下来需要初始化这个输出设备。将“wave provider” 作为输出设备的 `Init` 方法的参数来完成初始化。

	waveOut.Init(mp3Reader);

这会真正的打开声卡设备准备回放，但还没有真正开始播放。注意，这个时候会去检查声卡是否支持即将播放的这个音频格式。`IWaveProvider` 接口包含一个 `WaveFormat` 属性，并不是所有的输出设备都能播放所有的音频格式。在本例中，我们可能即将要成功了，因为 `Mp3FileReader` 已经将 MP3 音频格式转换成了 PCM。

### 开始回放

至此一切准备就绪，只需调用输出设备的 `Play` 方法即可开始回放。必须指出回放是异步非阻塞的。如果想在回放结束时得到通知，接下来我们就会讨论这个问题。

	waveOut.Play();

### 重定位

在回放期间你可以通过设置传给 `waveOut.Init` 方法的 `mp3Reader` 的 `Position` 属性来重定位播放位置。这个位置是以字节为单位，并且这个字节数是解码后的 PCM 音频，而不是原始的 MP3 音频文件。你可能发现了使用 `TimeSpan` 类型的 `CurrentTime` 属性会更简单些。

	// 重定位至 5 秒钟时
	mp3Reader.CurrentTime = TimeSpan.FromSeconds(5.0);

### 停止回放

默认输出设备（本例中的 `WaveOutEvent`）会播放我们传递给 `Init` 的音频流直至结束。当 `IWaveProvider.Read` 返回 0 的时候表示已到达音频流的末尾。假设你传入了一个 `Mp3FileReader` 或者其他文件读取类，那么你的文件将最终到达末尾。

你可以通过订阅 `PlaybackStopped` 事件来获得回放结束的通知。这个事件可以告诉你回放是否是由于声卡错误而结束的。比如，你的输出设备是个 USB 耳机，当你中途把它抽出来时就会看到这些错误中的其中一个。

	waveOut.PlaybackStopped += OnPlaybackStopped;

当然你可以在回放过程中的任何时候调用 `Stop` 来结束回放。需要注意的是当这个方法返回时回放可能并没有真正停止，因为我们仅仅是请求停止回放，这通常会很快完成。然而，只有当你收到 `PlaybackStopped` 通知时才能确认回放真正停止。

	waveOut.Stop();

你可以调用 `Play` 重新开始回放，回放将会从你上次读取的位置继续读取音频。如果你不想在恢复播放时错过即使几毫秒的音频，那么可以使用 `Pause` 来暂停播放。但是要注意暂停时的重定位，如果你想在暂停后从另一个位置恢复播放，那么最好在重新开始前先调用 `Stop`。

	waveOut.Stop();
	mp3Reader.Position = 0; // 回到文件开头
	// ... 一段时间后：
	waveOut.Play();

### 清理资源

回放结束后，记得分别调用 `waveOut` 和 `mp3FileReader` 的 `Dispose` 方法来释放资源。

	mp3Reader.Dispose();
	waveOut.Dispose();
