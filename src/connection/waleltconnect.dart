class WalletWebView extends StatefulWidget {
  @override
  _WalletWebViewState createState() => _WalletWebViewState();
}

class _WalletWebViewState extends State<WalletWebView> {
  late WebViewController _controller;
  late EthereumRequestHandler _requestHandler;  // Add this line
  
  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (String url) {
            _injectWalletProvider();
          },
        ),
      )
      ..setBackgroundColor(Colors.white)
      ..loadRequest(Uri.parse('https://your-dapp-url.com'));

    // Initialize the request handler
    _requestHandler = EthereumRequestHandler(_controller);
  }

  // ... rest of the WebView implementation
}

class EthereumRequestHandler {
  final WebViewController controller;
  bool _isConnected = false;
  String? _selectedAccount;
  
  EthereumRequestHandler(this.controller) {
    _setupMessageHandlers();
  }

  void _setupMessageHandlers() {
    controller.addJavaScriptChannel(
      'flutter_inappwebview',
      onMessageReceived: (JavaScriptMessage message) async {
        final data = jsonDecode(message.message);
        
        switch (data['method']) {
          case 'eth_requestAccounts':
            await _handleRequestAccounts();
            break;
            
          case 'eth_accounts':
            _handleGetAccounts();
            break;
            
          case 'eth_chainId':
            _handleGetChainId();
            break;
            
          // ... other methods
        }
      },
    );
  }

  Future<void> _handleRequestAccounts() async {
    if (_isConnected) {
      // If already connected, return current account
      _sendResponse({
        'id': DateTime.now().millisecondsSinceEpoch,
        'result': [_selectedAccount]
      });
      return;
    }

    // Show account selection UI
    final selectedAccount = await showAccountSelectionDialog();
    if (selectedAccount != null) {
      _selectedAccount = selectedAccount;
      _isConnected = true;
      
      // Notify the dApp that the account has changed
      _notifyAccountChanged();
      
      // Send the selected account back to the dApp
      _sendResponse({
        'id': DateTime.now().millisecondsSinceEpoch,
        'result': [selectedAccount]
      });
    } else {
      // User rejected the connection
      _sendError({
        'id': DateTime.now().millisecondsSinceEpoch,
        'error': {
          'code': 4001,
          'message': 'User rejected the connection'
        }
      });
    }
  }

  void _handleGetAccounts() {
    if (_isConnected && _selectedAccount != null) {
      _sendResponse({
        'id': DateTime.now().millisecondsSinceEpoch,
        'result': [_selectedAccount]
      });
    } else {
      _sendResponse({
        'id': DateTime.now().millisecondsSinceEpoch,
        'result': []
      });
    }
  }

  void _notifyAccountChanged() {
    controller.runJavaScript('''
      if (window.ethereum) {
        window.ethereum.emit('accountsChanged', ['$_selectedAccount']);
      }
    ''');
  }

  void _sendResponse(Map<String, dynamic> response) {
    controller.runJavaScript(
      'window.flutter_inappwebview.callHandler("handleResponse", ${jsonEncode(response)})'
    );
  }

  void _sendError(Map<String, dynamic> error) {
    controller.runJavaScript(
      'window.flutter_inappwebview.callHandler("handleError", ${jsonEncode(error)})'
    );
  }
}

// Account Selection Dialog
Future<String?> showAccountSelectionDialog() async {
  return showDialog<String>(
    context: navigatorKey.currentContext!,
    builder: (BuildContext context) {
      return AlertDialog(
        title: Text('Connect Wallet'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: Text('Account 1'),
              subtitle: Text('0x1234...'),
              onTap: () => Navigator.pop(context, '0x1234...'),
            ),
            ListTile(
              title: Text('Account 2'),
              subtitle: Text('0x5678...'),
              onTap: () => Navigator.pop(context, '0x5678...'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel'),
          ),
        ],
      );
    },
  );
}