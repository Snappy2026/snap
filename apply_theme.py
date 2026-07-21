import os
import re

SCREENS_DIR = "src/screens"

def make_screens_transparent():
    for root, _, files in os.walk(SCREENS_DIR):
        for file in files:
            if file.endswith((".tsx", ".ts")):
                filepath = os.path.join(root, file)
                with open(filepath, 'r') as f:
                    content = f.read()
                
                # Make black containers transparent
                content = content.replace("backgroundColor: '#000'", "backgroundColor: 'transparent'")
                content = content.replace('backgroundColor: "#000"', "backgroundColor: 'transparent'")
                content = content.replace("backgroundColor: '#000000'", "backgroundColor: 'transparent'")
                
                with open(filepath, 'w') as f:
                    f.write(content)

def update_app_navigator():
    filepath = "src/navigation/AppNavigator.tsx"
    with open(filepath, 'r') as f:
        content = f.read()

    # Import ImageBackground
    content = content.replace("  ActivityIndicator,\n} from \"react-native\";", "  ActivityIndicator,\n  ImageBackground,\n} from \"react-native\";")
    
    # Custom Theme
    theme_code = """
const AdultPlusTheme = {
  dark: true,
  colors: {
    primary: '#D4AF37',
    background: 'transparent',
    card: 'rgba(10,10,10,0.9)',
    text: '#ffffff',
    border: '#D4AF37',
    notification: '#D4AF37',
  },
};
"""
    if "const AdultPlusTheme" not in content:
        content = content.replace("const Tab = createBottomTabNavigator<MainTabParamList>();", theme_code + "\nconst Tab = createBottomTabNavigator<MainTabParamList>();")
    
    # Wrap NavigationContainer
    content = content.replace("<NavigationContainer>", "<ImageBackground source={require('../assets/marble_bg.png')} style={{flex: 1, backgroundColor: '#0a0a0a'}} resizeMode=\"cover\">\n      <NavigationContainer theme={AdultPlusTheme}>")
    content = content.replace("</NavigationContainer>", "</NavigationContainer>\n      </ImageBackground>")
    
    with open(filepath, 'w') as f:
        f.write(content)

make_screens_transparent()
update_app_navigator()
print("Background theme applied!")
