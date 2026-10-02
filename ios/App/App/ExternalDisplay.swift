import UIKit
import WebKit
import Capacitor

/**
 The TV screen over AirPlay (or a cable). When the player turns on Screen
 Mirroring, iOS hands the app a scene for the external display (routed here by
 SceneDelegate, see its role check); this puts a web view on it with the room's TV view, so the TV shows the game and the
 phone stays a controller. See NATIVE.md.

 The TV web view uses its own non-persistent storage, so it joins the room as
 a separate device (like a TV browser), never as the phone's player.
 */
final class ExternalDisplay {
    static let shared = ExternalDisplay()

    private var scene: UIWindowScene?
    private var window: UIWindow?
    private var webView: WKWebView?
    /** What the web app asked to show; kept so a display that connects later picks it up. */
    private var url: URL?

    var isConnected: Bool { scene != nil }
    var isShowing: Bool { isConnected && url != nil }

    /** Called with the new connected state whenever a display comes or goes. */
    var onChange: ((Bool) -> Void)?

    func connect(_ scene: UIWindowScene) {
        NSLog("[ExternalDisplay] connected %@", NSCoder.string(for: scene.coordinateSpace.bounds))
        self.scene = scene
        let window = UIWindow(windowScene: scene)
        window.frame = scene.coordinateSpace.bounds
        window.rootViewController = UIViewController()
        window.isHidden = false
        self.window = window
        render()
        onChange?(true)
    }

    /** The scene's size settles after it connects, and changes with the TV's mode: keep the window on it. */
    func resize(_ scene: UIWindowScene) {
        guard scene === self.scene, let window else { return }
        let bounds = scene.coordinateSpace.bounds
        if window.frame != bounds { window.frame = bounds }
    }

    func disconnect(_ scene: UIScene) {
        guard scene === self.scene else { return }
        NSLog("[ExternalDisplay] disconnected")
        webView = nil
        window = nil
        self.scene = nil
        UIApplication.shared.isIdleTimerDisabled = false
        onChange?(false)
    }

    func show(_ url: URL) {
        NSLog("[ExternalDisplay] show %@", url.absoluteString)
        self.url = url
        render()
    }

    func hide() {
        url = nil
        render()
    }

    private func render() {
        guard let root = window?.rootViewController else { return }
        root.view.backgroundColor = UIColor(hex: "#CC6B49")
        guard let url else {
            webView?.removeFromSuperview()
            webView = nil
            showPlaceholder(in: root.view)
            UIApplication.shared.isIdleTimerDisabled = false
            return
        }
        root.view.subviews.forEach { $0.removeFromSuperview() }
        let view = webView ?? makeWebView()
        if view.superview == nil {
            // Pinned to the edges: the scene's size is not final when the
            // window is made, so a frame copied from it comes out too small.
            view.translatesAutoresizingMaskIntoConstraints = false
            root.view.addSubview(view)
            NSLayoutConstraint.activate([
                view.topAnchor.constraint(equalTo: root.view.topAnchor),
                view.bottomAnchor.constraint(equalTo: root.view.bottomAnchor),
                view.leadingAnchor.constraint(equalTo: root.view.leadingAnchor),
                view.trailingAnchor.constraint(equalTo: root.view.trailingAnchor),
            ])
        }
        if view.url != url { view.load(URLRequest(url: url)) }
        webView = view
        // The phone drives the game, so it must not sleep mid-round.
        UIApplication.shared.isIdleTimerDisabled = true
    }

    private func makeWebView() -> WKWebView {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .nonPersistent()
        config.mediaTypesRequiringUserActionForPlayback = []
        let view = WKWebView(frame: .zero, configuration: config)
        view.isOpaque = false
        view.backgroundColor = .clear
        view.scrollView.isScrollEnabled = false
        // The TV window reports safe-area insets (overscan margins); left on,
        // the web view shrinks its viewport by them and the stage is cut off.
        view.scrollView.contentInsetAdjustmentBehavior = .never
        return view
    }

    /** Before a room is open: the game's ring mark and a line on what to do. Swap in the game's own mark if it isn't a ring. */
    private func showPlaceholder(in container: UIView) {
        container.subviews.forEach { $0.removeFromSuperview() }
        let ring = UIView()
        ring.layer.borderColor = UIColor(hex: "#FFFFFF").cgColor
        ring.layer.borderWidth = 34
        ring.layer.cornerRadius = 80
        ring.translatesAutoresizingMaskIntoConstraints = false

        let norwegian = Locale.preferredLanguages.first.map { ["nb", "nn", "no"].contains(String($0.prefix(2))) } ?? false
        let label = UILabel()
        label.text = norwegian ? "Start et rom på telefonen, så vises spillet her." : "Start a room on your phone and the game shows up here."
        label.textColor = UIColor(hex: "#FFFFFF")
        label.font = .systemFont(ofSize: 44, weight: .heavy)
        label.textAlignment = .center
        label.numberOfLines = 0
        label.translatesAutoresizingMaskIntoConstraints = false

        container.addSubview(ring)
        container.addSubview(label)
        NSLayoutConstraint.activate([
            ring.widthAnchor.constraint(equalToConstant: 160),
            ring.heightAnchor.constraint(equalToConstant: 160),
            ring.centerXAnchor.constraint(equalTo: container.centerXAnchor),
            ring.centerYAnchor.constraint(equalTo: container.centerYAnchor, constant: -70),
            label.topAnchor.constraint(equalTo: ring.bottomAnchor, constant: 56),
            label.centerXAnchor.constraint(equalTo: container.centerXAnchor),
            label.widthAnchor.constraint(lessThanOrEqualTo: container.widthAnchor, multiplier: 0.8),
        ])
    }
}

/** `ExternalDisplay` in lib/native.ts: getState, show({ url }), hide, and a `change` event. */
@objc(ExternalDisplayPlugin)
public class ExternalDisplayPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ExternalDisplayPlugin"
    public let jsName = "ExternalDisplay"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getState", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "show", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "hide", returnType: CAPPluginReturnPromise),
    ]

    override public func load() {
        NSLog("[ExternalDisplay] plugin loaded")
        ExternalDisplay.shared.onChange = { [weak self] connected in
            self?.notifyListeners("change", data: ["connected": connected])
        }
    }

    @objc func getState(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            call.resolve(["connected": ExternalDisplay.shared.isConnected, "showing": ExternalDisplay.shared.isShowing])
        }
    }

    @objc func show(_ call: CAPPluginCall) {
        guard let raw = call.getString("url"), let url = URL(string: raw), url.scheme == "https" || url.scheme == "http" else {
            call.reject("A http(s) url is required")
            return
        }
        DispatchQueue.main.async {
            ExternalDisplay.shared.show(url)
            call.resolve(["connected": ExternalDisplay.shared.isConnected])
        }
    }

    @objc func hide(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            ExternalDisplay.shared.hide()
            call.resolve()
        }
    }
}

/** The app's bridge view controller: registers the plugins that live in the app target. */
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(ExternalDisplayPlugin())
    }
}

private extension UIColor {
    /** "#RRGGBB", the design tokens as written in globals.css. */
    convenience init(hex: String) {
        let v = UInt32(hex.trimmingCharacters(in: CharacterSet(charactersIn: "#")), radix: 16) ?? 0
        self.init(red: CGFloat((v >> 16) & 0xFF) / 255, green: CGFloat((v >> 8) & 0xFF) / 255, blue: CGFloat(v & 0xFF) / 255, alpha: 1)
    }
}
