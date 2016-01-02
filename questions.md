* Should I regenerate buffer source each time change took place?
	* - it’s expensive and buggsome. For things like formant transformer, value, filter etc better use scriptProcessorNode, but keep source unchanged.
	* + using scriptProcessor makes impossible referencing like `source: url(#a2)`, as #a2 should be generated already. Ideally - regenerate buffers per-sample (or missed number of samples per tick) to avoid too big refreshes.
		* - Though it is able to save last buffer of scriptProcessorNode to provide to other guys while processing. We just have to make sure processors are called in proper order, and unfortunately we cannot affect it, as processor is independent shit. It is almost the same as per-sample handling.
			* - Suppose, we can pregenerate buffers in webworkers, and let scriptProcessors just take copied chunk, right? To make interdependent generation possible. The question is responsiveness.
* How to provide responsiveness?
	* Ideally, just schedule user’s intention and prioritize it. Handle it in webworker, leave main thread for UX only.