import UeEditor from './UeEditor.vue'
import UeRichTextPreview from './UeRichTextPreview.vue'

UeEditor.install = function install(Vue) {
  Vue.component(UeEditor.name, UeEditor)
  Vue.component(UeRichTextPreview.name, UeRichTextPreview)
}

export { UeEditor }
export { UeRichTextPreview }
export default UeEditor
