Pod::Spec.new do |s|
  s.name = 'TolkNativeAudio'
  s.version = '0.1.0'
  s.summary = 'Native transient PCM capture and iOS audio routing for Tolk og Lær'
  s.platforms = { :ios => '15.1' }
  s.source = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.{h,m,mm,swift}'
  s.swift_version = '5.9'
end
