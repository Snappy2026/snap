import os

filepath = "src/navigation/AppNavigator.tsx"
with open(filepath, 'r') as f:
    content = f.read()

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

content = content.replace("<NavigationContainer>", "<ImageBackground source={require('../assets/marble_bg.png')} style={{flex: 1, backgroundColor: '#0a0a0a'}} resizeMode=\"cover\">\n      <NavigationContainer theme={AdultPlusTheme as any}>")
content = content.replace("</NavigationContainer>", "</NavigationContainer>\n      </ImageBackground>")

with open(filepath, 'w') as f:
    f.write(content)

print("AppNavigator theme applied!")
