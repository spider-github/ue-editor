import UeEditor from './UeEditor.vue'

UeEditor.install = function install(Vue) {
  Vue.component(UeEditor.name, UeEditor)
}

export { UeEditor }
export default UeEditor
