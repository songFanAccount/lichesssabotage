import { ExtensionInfo } from "./ExtensionInfo"
import { ExtensionSettings } from "./ExtensionSettings"

export const ExtensionSettingsAndInfo = () => {
  return (
    <div style={{
      width: "100%",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: '24px',
    }}>
      <ExtensionSettings/>
      <ExtensionInfo/>
    </div>
  )
}