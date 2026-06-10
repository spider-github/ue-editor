<template>
  <div class="page">
    <h1>Vue2 UEditor Plus Demo</h1>
    <h2>Basic Demo</h2>
    <UeEditor
      v-model="content"
      :height="360"
      base-url="/static/ueditor-plus/"
      :upload-url="uploadUrl"
    />
    <h2>Basic Output</h2>
    <textarea :value="content" readonly />

    <h2>Rich Text Demo</h2>
    <UeEditor
      v-model="richContent"
      :height="560"
      base-url="/static/ueditor-plus/"
      :upload-url="uploadUrl"
      :config="editorConfig"
    />
    <UeRichTextPreview
      :content="richContent"
    />
    <h2>Rich Text Output</h2>
    <textarea :value="richContent" readonly />
  </div>
</template>

<script>
import { UeEditor, UeRichTextPreview } from 'vue2-ueditor-plus-editor';

export default {
  name: 'App',
  components: {
    UeEditor,
    UeRichTextPreview,
  },
  data() {
    return {
      content: '<p>hello ueditor plus</p>',
      richContent: `<p><br></p><h1>1. 文档概述</h1><p style="text-align: start;">本文档用于说明 ME 开放平台向合作方应用提供的授权接口能力。</p><p style="text-align: start;">接口基础路径：</p><p style="text-align: start;"><span style="color: rgb(232, 62, 140); background-color: rgba(23, 26, 29, 0.06); font-size: 0.875em; font-family: SFMono-Regular, Consolas, &quot;Liberation Mono&quot;, Menlo, Courier, monospace;"><code>/openWeb/app/auth</code></span></p><h1 style="text-align: start;">2. 统一返回格式</h1><p style="text-align: start;">所有接口均返回以下 JSON 结构：</p><pre style="text-align: start;"><code class="language-json">{
  "code": "200",
  "message": "OK",
  "timestamp": 1710000000000,
  "data": {}
}</code></pre><p style="text-align: start;">字段说明：</p><table style="width: 507px; table-layout: fixed; height: 0px; text-align: start; border-style: solid; border-color: rgba(23, 26, 29, 0.08);"><colgroup contenteditable="false"><col width="143"><col width="131"><col width="233"></colgroup><tbody><tr><th colspan="1" rowspan="1" width="auto" style="text-align: inherit;">字段</th><th colspan="1" rowspan="1" width="auto" style="text-align: inherit;">类型</th><th colspan="1" rowspan="1" width="auto" style="text-align: inherit;">说明</th></tr><tr><td colspan="1" rowspan="1" width="auto" style="border-style: solid;">code</td><td colspan="1" rowspan="1" width="auto" style="border-style: solid;">String</td><td colspan="1" rowspan="1" width="auto" style="border-style: solid;">业务响应码，<span style="color: rgb(232, 62, 140); background-color: rgba(23, 26, 29, 0.06); font-size: 0.875em; font-family: SFMono-Regular, Consolas, &quot;Liberation Mono&quot;, Menlo, Courier, monospace;"><code>200</code></span> 表示成功</td></tr><tr><td colspan="1" rowspan="1" width="auto" style="border-style: solid;">message</td><td colspan="1" rowspan="1" width="auto" style="border-style: solid;">String</td><td colspan="1" rowspan="1" width="auto" style="border-style: solid;">响应消息</td></tr><tr><td colspan="1" rowspan="1" width="auto" style="border-style: solid;">timestamp</td><td colspan="1" rowspan="1" width="auto" style="border-style: solid;">Long</td><td colspan="1" rowspan="1" width="auto" style="border-style: solid;">服务端响应时间戳，毫秒</td></tr><tr><td colspan="1" rowspan="1" width="auto" style="border-style: solid;">data</td><td colspan="1" rowspan="1" width="auto" style="border-style: solid;">Object</td><td colspan="1" rowspan="1" width="auto" style="border-style: solid;">响应数据</td></tr></tbody></table><h1 style="text-align: start;">10. 示例代码</h1><h3 style="text-align: start;">10.1 Java 示例</h3><pre style="text-align: start;"><code class="language-java">import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

public class MeOpenAuthExample {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static void main(String[] args) throws Exception {
        String baseUrl = "https://your-domain.com";
        String appCode = "your_app_code";
        String secretKey = "your_secret_key";
    }
}</code></pre><h3 style="text-align: start;">10.2 PHP 示例</h3><pre style="text-align: start;"><code class="language-php">&lt;?php

$baseUrl = 'https://your-domain.com';
$appCode = 'your_app_code';
$secretKey = 'your_secret_key';

echo $appCode . PHP_EOL;</code></pre><h3 style="text-align: start;">10.3 Node.js 示例</h3><pre style="text-align: start;"><code class="language-javascript">const crypto = require('crypto');

async function main() {
  const baseUrl = 'https://your-domain.com';
  const appCode = 'your_app_code';
  const secretKey = 'your_secret_key';

  console.log(baseUrl, appCode, secretKey);
}

main().catch(console.error);</code></pre><p><br></p>`,
      uploadUrl: '',
      editorConfig: {
        toolbars: [
          [
            'fullscreen',
            'source',
            '|',
            'undo',
            'redo',
            '|',
            'bold',
            'italic',
            'underline',
            'fontborder',
            'strikethrough',
            'superscript',
            'subscript',
            'removeformat',
            'formatmatch',
            'autotypeset',
            'blockquote',
            '|',
            'forecolor',
            'backcolor',
            'insertorderedlist',
            'insertunorderedlist',
            '|',
            'rowspacingtop',
            'rowspacingbottom',
            'lineheight',
            '|',
            'paragraph',
            'fontfamily',
            'fontsize',
            '|',
            'directionalityltr',
            'directionalityrtl',
            'indent',
            '|',
            'justifyleft',
            'justifycenter',
            'justifyright',
            'justifyjustify',
            '|',
            'touppercase',
            'tolowercase',
            '|',
            'link',
            'unlink',
            'anchor',
            '|',
            'imagenone',
            'imageleft',
            'imageright',
            'imagecenter',
            '|',
            'simpleupload',
            'insertimage',
            'scrawl',
            'attachment',
            'insertvideo',
            'music',
            'insertcode',
            'formula',
            '|',
            'inserttable',
            'deletetable',
            'insertparagraphbeforetable',
            'insertrow',
            'deleterow',
            'insertcol',
            'deletecol',
            'mergecells',
            'mergeright',
            'mergedown',
            'splittocells',
            'splittorows',
            'splittocols',
            '|',
            'charts',
            '|',
            'searchreplace',
            'preview',
          ],
        ],
      },
    }
  },
}
</script>

<style>
body {
  font-family: sans-serif;
  margin: 0;
}

.page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 24px;
}

textarea {
  width: 100%;
  min-height: 200px;
  margin-bottom: 24px;
}
</style>
