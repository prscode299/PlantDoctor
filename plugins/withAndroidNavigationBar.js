const { withAndroidStyles } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to ensure Android navigation bar is solid white
 * with dark system buttons and prevents app content from drawing
 * underneath the system Home/Back/Recents buttons.
 */
module.exports = function withAndroidNavigationBar(config) {
  return withAndroidStyles(config, async (config) => {
    const styles = config.modResults;
    const appTheme = styles.resources.style.find((s) => s.$.name === 'AppTheme');

    if (appTheme && appTheme.item) {
      // 1. Remove transparent navigation bar if present
      appTheme.item = appTheme.item.filter(
        (item) => item.$.name !== 'android:navigationBarColor'
      );

      // 2. Set solid white navigation bar so content doesn't draw behind system buttons
      appTheme.item.push({
        $: { name: 'android:navigationBarColor' },
        _: '#FFFFFF',
      });

      // 3. Ensure dark icons for Home/Back/Recents on light background
      const lightNavIndex = appTheme.item.findIndex(
        (item) => item.$.name === 'android:windowLightNavigationBar'
      );
      if (lightNavIndex !== -1) {
        appTheme.item[lightNavIndex]._ = 'true';
      } else {
        appTheme.item.push({
          $: {
            name: 'android:windowLightNavigationBar',
            'tools:targetApi': 'o_mr1',
          },
          _: 'true',
        });
      }

      // 4. Ensure window draws system bar backgrounds
      const drawsBgIndex = appTheme.item.findIndex(
        (item) => item.$.name === 'android:windowDrawsSystemBarBackgrounds'
      );
      if (drawsBgIndex !== -1) {
        appTheme.item[drawsBgIndex]._ = 'true';
      } else {
        appTheme.item.push({
          $: { name: 'android:windowDrawsSystemBarBackgrounds' },
          _: 'true',
        });
      }
    }

    return config;
  });
};
