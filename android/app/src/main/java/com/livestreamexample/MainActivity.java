package com.livestreamexample;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.evanjmg.RNHomePressedPackage;

import java.util.Arrays;
import java.util.List;

import android.app.PictureInPictureParams;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Rational;
import android.view.WindowManager;


public class MainActivity extends ReactActivity {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "LiveStreamExample";
  }
 
  private void superFinish() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
        finishAndRemoveTask();
    } else {
        finish();
    }
}
  
  @Override
  public void onBackPressed() {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N
              && getPackageManager().hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE)) {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
              PictureInPictureParams params = new PictureInPictureParams
                      .Builder()
                      .setAspectRatio(new Rational(50, 9))
                      .build();
              enterPictureInPictureMode(params);
          } else {
              enterPictureInPictureMode();
          }
      } else {
          superFinish();
      }
  }

  protected List<ReactPackage> getPackages(){
    return Arrays.<ReactPackage>asList(
      new MainReactPackage(),
      new RNHomePressedPackage()
    );
  }
}
